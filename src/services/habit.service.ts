import { db } from '@/lib/db'

export interface CreateHabitData {
  userId: string
  title: string
  description?: string
  habitType: string
  frequency: string
  goalId?: string
}

export interface HabitFilters {
  status?: string
  habitType?: string
  goalId?: string
}

export const habitService = {
  async createHabit(data: CreateHabitData) {
    const habit = await db.habit.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description ?? null,
        habitType: data.habitType,
        frequency: data.frequency,
        goalId: data.goalId ?? null,
        status: 'active',
        metadata: {},
      },
    })

    if (data.goalId) {
      await db.lifeGraphEdge.create({
        data: {
          userId: data.userId,
          sourceEntityId: habit.id,
          sourceEntityType: 'habit',
          targetEntityId: data.goalId,
          targetEntityType: 'goal',
          edgeType: 'supports' as any,
          weight: 1.0,
          metadata: {},
        },
      })
    }

    return habit
  },

  async logHabit(habitId: string, userId: string, date: string, value?: number, note?: string) {
    const logDate = new Date(date)
    logDate.setHours(0, 0, 0, 0)

    const existing = await db.habitLog.findUnique({
      where: { habitId_userId_date: { habitId, userId, date: logDate } },
    })

    if (existing) {
      return db.habitLog.update({
        where: { id: existing.id },
        data: { value: value ?? existing.value, note: note ?? existing.note },
      })
    }

    const log = await db.habitLog.create({
      data: {
        habitId,
        userId,
        date: logDate,
        value: value ?? 1.0,
        note: note ?? null,
      },
    })

    const totalCount = await db.habitLog.count({ where: { habitId } })
    const latestLogs = await db.habitLog.findMany({
      where: { habitId },
      orderBy: { date: 'desc' },
      take: 365,
    })

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 0; i < latestLogs.length; i++) {
      const expected = new Date(today)
      expected.setDate(expected.getDate() - i)
      const logDateEntry = new Date(latestLogs[i].date)
      logDateEntry.setHours(0, 0, 0, 0)
      if (logDateEntry.getTime() === expected.getTime()) {
        streak++
      } else {
        break
      }
    }

    const habit = await db.habit.findUnique({ where: { id: habitId } })
    const bestStreak = Math.max(streak, habit?.bestStreak ?? 0)
    await db.habit.update({
      where: { id: habitId },
      data: { totalCount, streak, bestStreak },
    })

    return log
  },

  async getStreak(habitId: string) {
    const habit = await db.habit.findUnique({ where: { id: habitId } })
    if (!habit) return { current: 0, best: 0 }
    return { current: habit.streak, best: habit.bestStreak }
  },

  async listHabits(userId: string, filters?: HabitFilters) {
    const where: any = { userId, deletedAt: null }
    if (filters?.status) where.status = filters.status
    if (filters?.habitType) where.habitType = filters.habitType
    if (filters?.goalId) where.goalId = filters.goalId
    return db.habit.findMany({ where, orderBy: [{ status: 'asc' }, { createdAt: 'desc' }] })
  },

  async getHabitCalendar(habitId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const logs = await db.habitLog.findMany({
      where: { habitId, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
    })

    const calendar: Record<string, { value: number | null; note: string | null }> = {}
    for (const log of logs) {
      const key = log.date.toISOString().split('T')[0]
      calendar[key] = { value: log.value, note: log.note }
    }

    return calendar
  },
}
