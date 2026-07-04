import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildGoalTree } from '@/engine'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const goal = await prisma.goal.findUnique({ where: { id } })
    if (!goal || goal.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Goal not found' } }, { status: 404 })
    }

    const allGoals = await prisma.goal.findMany({
      where: { userId: goal.userId, deletedAt: null },
    })

    const tree = buildGoalTree(allGoals as any)

    const findSubtree = (nodes: typeof tree, targetId: string): typeof tree => {
      for (const node of nodes) {
        if (node.id === targetId) return [node]
        const sub = findSubtree(node.children, targetId)
        if (sub.length > 0) return sub
      }
      return []
    }

    const subtree = findSubtree(tree, id)
    return NextResponse.json({ data: subtree })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch goal tree' } }, { status: 500 })
  }
}
