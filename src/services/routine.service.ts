import { db } from '@/lib/db'

export interface CreateRoutineStep {
  title: string
  description?: string
  order: number
  durationMinutes?: number
}

export interface CreateRoutineData {
  userId: string
  title: string
  description?: string
  routineType: string
  timeOfDay?: string
  durationMinutes?: number
  isFlexible?: boolean
  steps?: CreateRoutineStep[]
}

export const routineService = {
  async createRoutine(data: CreateRoutineData) {
    const routine = await db.routine.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description ?? null,
        routineType: data.routineType,
        timeOfDay: data.timeOfDay ?? null,
        durationMinutes: data.durationMinutes ?? null,
        isFlexible: data.isFlexible ?? true,
        status: 'active',
        metadata: {},
        steps: data.steps
          ? { create: data.steps.map((s) => ({ title: s.title, description: s.description ?? null, order: s.order, durationMinutes: s.durationMinutes ?? null })) }
          : undefined,
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    })
    return routine
  },

  async getRoutine(id: string) {
    const routine = await db.routine.findUnique({
      where: { id },
      include: { steps: { orderBy: { order: 'asc' } } },
    })
    if (!routine || routine.deletedAt) return null
    return routine
  },

  async updateRoutine(id: string, data: Partial<CreateRoutineData>) {
    const existing = await db.routine.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) return null

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.routineType !== undefined) updateData.routineType = data.routineType
    if (data.timeOfDay !== undefined) updateData.timeOfDay = data.timeOfDay
    if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes
    if (data.isFlexible !== undefined) updateData.isFlexible = data.isFlexible

    return db.routine.update({
      where: { id },
      data: updateData,
      include: { steps: { orderBy: { order: 'asc' } } },
    })
  },

  async addStep(routineId: string, data: CreateRoutineStep) {
    const routine = await db.routine.findUnique({ where: { id: routineId } })
    if (!routine || routine.deletedAt) return null

    return db.routineStep.create({
      data: {
        routineId,
        title: data.title,
        description: data.description ?? null,
        order: data.order,
        durationMinutes: data.durationMinutes ?? null,
      },
    })
  },

  async removeStep(stepId: string) {
    const step = await db.routineStep.findUnique({ where: { id: stepId } })
    if (!step) return null
    await db.routineStep.delete({ where: { id: stepId } })
    return { success: true }
  },

  async listRoutines(userId: string) {
    return db.routine.findMany({
      where: { userId, deletedAt: null, status: 'active' },
      include: { steps: { orderBy: { order: 'asc' } } },
      orderBy: [{ timeOfDay: 'asc' }, { createdAt: 'desc' }],
    })
  },

  async getRoutinesForDay(userId: string, dayOfWeek: string) {
    const routines = await db.routine.findMany({
      where: { userId, deletedAt: null, status: 'active' },
      include: { steps: { orderBy: { order: 'asc' } } },
    })

    const dayRoutines = routines.filter((r) => {
      const metadata = r.metadata as Record<string, unknown> ?? {}
      const days = metadata.days as string[] ?? []
      return days.length === 0 || days.includes(dayOfWeek)
    })

    return dayRoutines
  },
}
