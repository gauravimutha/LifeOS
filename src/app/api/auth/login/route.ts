import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' } },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || user.deletedAt) {
      return NextResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 400 }
      )
    }

    if (email !== 'admin@lifeos.com' && !user.isApproved) {
      return NextResponse.json(
        { error: { code: 'PENDING_APPROVAL', message: 'Your account is pending approval by the administrator.' } },
        { status: 403 }
      )
    }

    // Enforce password check for the admin account
    const adminPassword = process.env.ADMIN_PASSWORD
    if (email === 'admin@lifeos.com' && adminPassword && password !== adminPassword) {
      return NextResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 400 }
      )
    }

    // Return user info for local session storage
    return NextResponse.json({ data: user })
  } catch (error) {
    console.error('Local login error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to sign in' } },
      { status: 500 }
    )
  }
}
