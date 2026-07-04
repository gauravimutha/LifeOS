import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, onboardingCompleted } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Name and email are required' } },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_EMAIL', message: 'A user with this email already exists' } },
        { status: 400 }
      )
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        onboardingCompleted: !!onboardingCompleted,
        timezone: 'UTC',
        locale: 'en',
        preferences: {},
        aiSettings: {}
      }
    })

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create user' } },
      { status: 500 }
    )
  }
}
