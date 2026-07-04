import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'userId is required' } }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const checkin = await prisma.checkIn.findFirst({
      where: {
        userId,
        date: { gte: today, lt: tomorrow },
      },
    })

    return NextResponse.json({ data: checkin })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch check-in' } }, { status: 500 })
  }
}
