import { db } from '@/lib/db'

export interface HealthDataInput {
  userId: string
  date: string
  sleepHours?: number
  sleepQuality?: number
  energyLevel?: number
  moodScore?: number
  stressLevel?: number
  steps?: number
  exerciseMinutes?: number
  metadata?: Record<string, unknown>
}

export const healthService = {
  async logHealthData(data: HealthDataInput) {
    const recordDate = new Date(data.date)
    recordDate.setHours(0, 0, 0, 0)

    const existing = await db.healthData.findUnique({
      where: { userId_date: { userId: data.userId, date: recordDate } },
    })

    if (existing) {
      return db.healthData.update({
        where: { id: existing.id },
        data: {
          sleepHours: data.sleepHours ?? existing.sleepHours,
          sleepQuality: data.sleepQuality ?? existing.sleepQuality,
          energyLevel: data.energyLevel ?? existing.energyLevel,
          moodScore: data.moodScore ?? existing.moodScore,
          stressLevel: data.stressLevel ?? existing.stressLevel,
          steps: data.steps ?? existing.steps,
          exerciseMinutes: data.exerciseMinutes ?? existing.exerciseMinutes,
          metadata: (data.metadata ?? {}) as any,
        },
      })
    }

    return db.healthData.create({
      data: {
        userId: data.userId,
        date: recordDate,
        sleepHours: data.sleepHours ?? null,
        sleepQuality: data.sleepQuality ?? null,
        energyLevel: data.energyLevel ?? null,
        moodScore: data.moodScore ?? null,
        stressLevel: data.stressLevel ?? null,
        steps: data.steps ?? null,
        exerciseMinutes: data.exerciseMinutes ?? null,
        metadata: (data.metadata ?? {}) as any,
      },
    })
  },

  async getHealthData(userId: string, date: string) {
    const recordDate = new Date(date)
    recordDate.setHours(0, 0, 0, 0)
    return db.healthData.findUnique({
      where: { userId_date: { userId, date: recordDate } },
    })
  },

  async getHealthRange(userId: string, fromDate: string, toDate: string) {
    return db.healthData.findMany({
      where: {
        userId,
        date: { gte: new Date(fromDate), lte: new Date(toDate) },
      },
      orderBy: { date: 'asc' },
    })
  },

  async getHealthSummary(userId: string, fromDate: string, toDate: string) {
    const records = await db.healthData.findMany({
      where: {
        userId,
        date: { gte: new Date(fromDate), lte: new Date(toDate) },
      },
    })

    if (records.length === 0) {
      return { avgSleep: null, avgEnergy: null, avgMood: null, avgStress: null, avgSteps: null, avgExercise: null, recordCount: 0 }
    }

    const avg = (vals: (number | null)[]) => {
      const nums = vals.filter((v): v is number => v !== null)
      return nums.length > 0 ? Math.round((nums.reduce((s, v) => s + v, 0) / nums.length) * 10) / 10 : null
    }

    return {
      avgSleep: avg(records.map((r) => r.sleepHours)),
      avgEnergy: avg(records.map((r) => r.energyLevel)),
      avgMood: avg(records.map((r) => r.moodScore)),
      avgStress: avg(records.map((r) => r.stressLevel)),
      avgSteps: Math.round(avg(records.map((r) => r.steps)) ?? 0),
      avgExercise: avg(records.map((r) => r.exerciseMinutes)),
      recordCount: records.length,
    }
  },

  async getHealthTrends(userId: string, days: number) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const records = await db.healthData.findMany({
      where: { userId, date: { gte: startDate } },
      orderBy: { date: 'asc' },
    })

    const getTrend = (key: keyof typeof records[0]) => {
      const vals = records.map((r) => r[key] as number | null).filter((v): v is number => v !== null)
      if (vals.length < 3) return { trend: 'insufficient_data', change: 0 }
      const firstHalf = vals.slice(0, Math.floor(vals.length / 2))
      const secondHalf = vals.slice(Math.floor(vals.length / 2))
      const avg1 = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length
      const avg2 = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length
      const change = Math.round((avg2 - avg1) * 10) / 10
      return { trend: change > 0.5 ? 'improving' : change < -0.5 ? 'declining' : 'stable', change }
    }

    return {
      sleep: getTrend('sleepHours'),
      energy: getTrend('energyLevel'),
      mood: getTrend('moodScore'),
      stress: getTrend('stressLevel'),
      steps: getTrend('steps'),
      exercise: getTrend('exerciseMinutes'),
      recordCount: records.length,
    }
  },
}
