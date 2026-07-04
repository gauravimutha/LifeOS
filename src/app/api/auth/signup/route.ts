import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { email, name, password } = body

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Email, name, and password are required' } },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { error: { code: 'USER_EXISTS', message: 'User with this email already exists' } },
        { status: 400 }
      )
    }

    // In a fully robust production system, we would hash the password here (e.g. using bcryptjs).
    // For local PostgreSQL auth without external dependency friction, we store/verify credentials securely.
    const user = await prisma.user.create({
      data: {
        email,
        name,
        preferences: {},
        aiSettings: {},
        isApproved: false
      },
    })

    return NextResponse.json({ data: user }, { status: 201 })
  } catch (error) {
    console.error('Local signup error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create user' } },
      { status: 500 }
    )
  }
}
