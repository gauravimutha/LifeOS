import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUser } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url)
    const userId = searchParams.get('userId')

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    const relationships = await prisma.relationship.findMany({
      where: { userId: userId as string, deletedAt: null },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: relationships })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch relationships' } }, { status: 500 })
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json()
    const { userId, name, relationshipType, importance, notes, lastContact } = body

    if (!name || !relationshipType) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'name and relationshipType are required' } }, { status: 400 })
    }

    const authResult = await verifyUser(_req, userId)
    if (authResult.error) return authResult.error

    const relationship = await prisma.relationship.create({
      data: {
        userId: userId as string,
        name,
        relationshipType,
        importance: importance ? Number(importance) : null,
        notes: notes ?? null,
        lastContact: lastContact ? new Date(lastContact) : null,
      },
    })

    return NextResponse.json({ data: relationship }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create relationship' } }, { status: 500 })
  }
}
