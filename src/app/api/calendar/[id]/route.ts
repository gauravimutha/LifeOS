import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await _req.json()
    const existing = await prisma.calendarEvent.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Event not found' } }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.location !== undefined) data.location = body.location
    if (body.startTime !== undefined) data.startTime = new Date(body.startTime)
    if (body.endTime !== undefined) data.endTime = new Date(body.endTime)
    if (body.isAllDay !== undefined) data.isAllDay = body.isAllDay
    if (body.status !== undefined) data.status = body.status
    if (body.eventType !== undefined) data.eventType = body.eventType

    const event = await prisma.calendarEvent.update({ where: { id }, data })
    return NextResponse.json({ data: event })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update event' } }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const existing = await prisma.calendarEvent.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Event not found' } }, { status: 404 })
    }
    await prisma.calendarEvent.update({ where: { id }, data: { deletedAt: new Date() } })
    return NextResponse.json({ data: { id } })
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete event' } }, { status: 500 })
  }
}
