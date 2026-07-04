import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUser } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0

    const sessions = await prisma.aIChatMessage.findMany({
      where: { userId: userId as string },
      select: { sessionId: true, createdAt: true, content: true, role: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const sessionMap = new Map<string, { sessionId: string; messageCount: number; lastMessage: string; lastMessageAt: string }>()
    for (const msg of sessions) {
      if (!sessionMap.has(msg.sessionId)) {
        sessionMap.set(msg.sessionId, {
          sessionId: msg.sessionId,
          messageCount: 0,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt.toISOString(),
        })
      }
      const entry = sessionMap.get(msg.sessionId)!
      entry.messageCount++
      if (msg.createdAt.toISOString() > entry.lastMessageAt) {
        entry.lastMessage = msg.content
        entry.lastMessageAt = msg.createdAt.toISOString()
      }
    }

    return NextResponse.json({ data: Array.from(sessionMap.values()) })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list sessions' } }, { status: 500 })
  }
}
