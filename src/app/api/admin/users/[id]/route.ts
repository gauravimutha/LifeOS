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
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await prisma.user.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    // Toggle soft delete status
    const isDeleted = existing.deletedAt !== null
    const updated = await prisma.user.update({
      where: { id },
      data: {
        deletedAt: isDeleted ? null : new Date()
      }
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Failed to toggle soft delete status:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to toggle status' } },
      { status: 500 }
    )
  }
}
