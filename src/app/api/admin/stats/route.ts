import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const totalUsers = await prisma.user.count()
    const onboardedUsers = await prisma.user.count({
      where: { onboardingCompleted: true }
    })
    const totalGoals = await prisma.goal.count()
    
    // Count completed daily actions
    const completedTasks = await prisma.dailyAction.count({
      where: { status: 'completed' }
    })
    
    // Fetch all users in the system
    const allUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      data: {
        totalUsers,
        onboardedUsers,
        totalGoals,
        completedTasks,
        recentUsers: allUsers // Match field names expected by client AdminPage
      }
    })
  } catch (error) {
    console.error('Failed to fetch admin stats:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve stats' } },
      { status: 500 }
    )
  }
}
