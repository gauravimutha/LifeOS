import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, email, onboardingCompleted, timezone, locale } = body

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    // If email is changing, verify it's not a duplicate
    if (email && email !== existing.email) {
      const duplicate = await prisma.user.findUnique({
        where: { email }
      })
      if (duplicate) {
        return NextResponse.json(
          { error: { code: 'DUPLICATE_EMAIL', message: 'A user with this email already exists' } },
          { status: 400 }
        )
      }
    }

    // Update user
    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        email: email !== undefined ? email : undefined,
        onboardingCompleted: onboardingCompleted !== undefined ? !!onboardingCompleted : undefined,
        timezone: timezone !== undefined ? timezone : undefined,
        locale: locale !== undefined ? locale : undefined
      }
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update user' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const isHardDelete = searchParams.get('hard') === 'true'

    const existing = await prisma.user.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    if (isHardDelete) {
      // Execute cascading deletes of all child tables in a single batch transaction to avoid timeout
      await prisma.$transaction([
        prisma.goal.deleteMany({ where: { userId: id } }),
        prisma.roadmap.deleteMany({ where: { userId: id } }),
        prisma.dailyPlan.deleteMany({ where: { userId: id } }),
        prisma.executionHistory.deleteMany({ where: { userId: id } }),
        prisma.habit.deleteMany({ where: { userId: id } }),
        prisma.habitLog.deleteMany({ where: { userId: id } }),
        prisma.routine.deleteMany({ where: { userId: id } }),
        prisma.calendarEvent.deleteMany({ where: { userId: id } }),
        prisma.journalEntry.deleteMany({ where: { userId: id } }),
        prisma.healthData.deleteMany({ where: { userId: id } }),
        prisma.relationship.deleteMany({ where: { userId: id } }),
        prisma.aIMemory.deleteMany({ where: { userId: id } }),
        prisma.aIChatMessage.deleteMany({ where: { userId: id } }),
        prisma.analyticsEvent.deleteMany({ where: { userId: id } }),
        prisma.checkIn.deleteMany({ where: { userId: id } }),
        prisma.dailyReview.deleteMany({ where: { userId: id } }),
        prisma.periodReview.deleteMany({ where: { userId: id } }),
        prisma.focusSession.deleteMany({ where: { userId: id } }),
        prisma.notification.deleteMany({ where: { userId: id } }),
        prisma.lifeGraphEdge.deleteMany({ where: { userId: id } }),
        prisma.user.delete({ where: { id } })
      ])

      return NextResponse.json({ data: { message: 'User deleted permanently' } })
    }

    // Toggle soft delete status (default behavior)
    const isDeleted = existing.deletedAt !== null
    const updated = await prisma.user.update({
      where: { id },
      data: {
        deletedAt: isDeleted ? null : new Date()
      }
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete user' } },
      { status: 500 }
    )
  }
}
