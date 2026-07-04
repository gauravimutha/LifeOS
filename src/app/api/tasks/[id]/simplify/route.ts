import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Find existing action
    const existing = await prisma.dailyAction.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Action not found' } }, { status: 404 })
    }

    const { userId, dailyPlanId, activity, type, reason, startTime, endTime, roadmapStepId } = existing

    const startMs = startTime.getTime()
    const endMs = endTime.getTime()
    const durationMs = endMs - startMs

    // Calculate split times
    // Step 1: 25% of time (max 15 mins)
    const split1 = startMs + Math.min(15 * 60 * 1000, Math.floor(durationMs * 0.25))
    // Step 2: 50% of time (up to 75% point)
    const split2 = split1 + Math.max(0, Math.floor(durationMs * 0.5))

    // We split the action into 3 bite-sized actions in a transaction
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Mark original action as skipped (replaced)
      const updatedOriginal = await tx.dailyAction.update({
        where: { id },
        data: {
          status: 'skipped',
          metadata: {
            simplifiedAt: new Date().toISOString(),
            replacedBySplits: true
          }
        }
      })

      // 2. Create smaller actions
      const act1 = await tx.dailyAction.create({
        data: {
          dailyPlanId,
          userId,
          roadmapStepId,
          startTime: new Date(startMs),
          endTime: new Date(split1),
          activity: `15-min Action: Setup & outline for "${activity}"`,
          type,
          reason: `Bite-sized prep step to overcome initial resistance: ${reason}`,
          status: 'pending'
        }
      })

      const act2 = await tx.dailyAction.create({
        data: {
          dailyPlanId,
          userId,
          roadmapStepId,
          startTime: new Date(split1),
          endTime: new Date(split2),
          activity: `30-min Block: Execute first milestone of "${activity}"`,
          type,
          reason: `Focused work interval to build momentum: ${reason}`,
          status: 'pending'
        }
      })

      const act3 = await tx.dailyAction.create({
        data: {
          dailyPlanId,
          userId,
          roadmapStepId,
          startTime: new Date(split2),
          endTime: new Date(endMs),
          activity: `15-min Log: Capture learnings & schedule follow-ups`,
          type,
          reason: `Close out the session and note down next action items.`,
          status: 'pending'
        }
      })

      return {
        updatedOriginal,
        createdActions: [act1, act2, act3]
      }
    }, {
      timeout: 10000
    })

    return NextResponse.json({ data: transactionResult })
  } catch (error) {
    console.error('Failed to simplify action:', error)
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to simplify action' } }, { status: 500 })
  }
}
