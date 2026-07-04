import { db } from '@/lib/db'
import type { LifeMode } from '@/types'

export const lifeModeService = {
  async detectMode(userId: string): Promise<{ mode: LifeMode; confidence: number; signals: string[] }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [events, health, journalEntries, routines] = await Promise.all([
      db.calendarEvent.findMany({
        where: { userId, deletedAt: null, startTime: { gte: today } },
        orderBy: { startTime: 'asc' },
        take: 20,
      }),
      db.healthData.findMany({
        where: { userId, date: { gte: weekAgo } },
        orderBy: { date: 'desc' },
      }),
      db.journalEntry.findMany({
        where: { userId, entryDate: { gte: weekAgo }, deletedAt: null },
        orderBy: { entryDate: 'desc' },
      }),
      db.routine.findMany({
        where: { userId, deletedAt: null, status: 'active' },
      }),
    ])

    const signals: string[] = []
    const modeScores: Record<string, number> = {}

    const avgEnergy = health.length > 0
      ? health.reduce((s, r) => s + (r.energyLevel ?? 5), 0) / health.length
      : 5

    const avgMood = health.length > 0
      ? health.reduce((s, r) => s + (r.moodScore ?? 5), 0) / health.length
      : 5

    const eventTitles = events.map((e) => e.title.toLowerCase())
    const journalContent = journalEntries.map((j) => j.content.toLowerCase()).join(' ')

    if (avgEnergy < 3 && avgMood < 4) {
      modeScores['recovery'] = (modeScores['recovery'] ?? 0) + 30
      signals.push('Low energy and mood detected')
    }

    if (eventTitles.some((t) => t.includes('flight') || t.includes('hotel') || t.includes('trip') || t.includes('vacation'))) {
      modeScores['travel'] = (modeScores['travel'] ?? 0) + 40
      signals.push('Travel-related events found')
    }

    if (eventTitles.filter((t) => t.includes('meeting') || t.includes('focus') || t.includes('block')).length > 5) {
      modeScores['deep_work'] = (modeScores['deep_work'] ?? 0) + 25
      signals.push('Multiple focus/meeting blocks detected')
    }

    if (journalContent.includes('holiday') || journalContent.includes('vacation') || journalContent.includes('break')) {
      modeScores['holiday'] = (modeScores['holiday'] ?? 0) + 35
      signals.push('Holiday/vacation mentioned in journal')
    }

    if (journalContent.includes('family') || journalContent.includes('kids') || eventTitles.some((t) => t.includes('family'))) {
      modeScores['family'] = (modeScores['family'] ?? 0) + 25
      signals.push('Family-related content detected')
    }

    if (eventTitles.filter((t) => t.includes('deep') || t.includes('focus')).length > 3) {
      modeScores['deep_work'] = (modeScores['deep_work'] ?? 0) + 20
      signals.push('Deep work sessions scheduled')
    }

    const hasMorningRoutine = routines.some((r) => r.timeOfDay === 'morning')
    const hasEveningRoutine = routines.some((r) => r.timeOfDay === 'evening')

    if (hasMorningRoutine && hasEveningRoutine && avgEnergy > 5) {
      modeScores['normal'] = (modeScores['normal'] ?? 0) + 20
      signals.push('Regular routines and good energy')
    }

    modeScores['normal'] = (modeScores['normal'] ?? 0) + 5

    const sorted = Object.entries(modeScores).sort((a, b) => b[1] - a[1])
    const topMode = sorted[0]?.[0] ?? 'normal'
    const topScore = sorted[0]?.[1] ?? 5
    const totalScore = sorted.reduce((s, [, v]) => s + v, 0)
    const confidence = totalScore > 0 ? Math.round((topScore / totalScore) * 100) : 50

    await this.setMode(userId, topMode as LifeMode)

    return { mode: topMode as LifeMode, confidence, signals }
  },

  async setMode(userId: string, mode: LifeMode) {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return null

    const preferences = (user.preferences as Record<string, unknown>) ?? {}
    const updated = await db.user.update({
      where: { id: userId },
      data: {
        preferences: { ...preferences, currentLifeMode: mode, lastModeChange: new Date().toISOString() } as any,
      },
    })
    return updated
  },

  async getCurrentMode(userId: string): Promise<{ mode: LifeMode; changedAt?: string }> {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return { mode: 'normal' }

    const prefs = (user.preferences as Record<string, unknown>) ?? {}
    const mode = (prefs.currentLifeMode as LifeMode) ?? 'normal'
    const changedAt = prefs.lastModeChange as string | undefined

    return { mode, changedAt }
  },

  getModeEffects(mode: LifeMode) {
    const effects: Record<LifeMode, {
      planning: string
      notifications: string
      ai: string
      schedule: string
    }> = {
      normal: {
        planning: 'Standard planning with balanced priorities',
        notifications: 'Normal notification schedule',
        ai: 'Balanced AI assistance',
        schedule: 'Regular scheduling',
      },
      travel: {
        planning: 'Light planning; focus on essentials',
        notifications: 'Minimal notifications; timezone-aware',
        ai: 'Travel-optimized suggestions; packing lists, itinerary',
        schedule: 'Flexible blocks; account for transit time',
      },
      recovery: {
        planning: 'Minimal planning; focus on rest and basic needs',
        notifications: 'Reduced to essential only',
        ai: 'Gentle, supportive; prioritize health and rest',
        schedule: 'Large rest blocks; minimal commitments',
      },
      focus: {
        planning: 'Deep work blocks; minimize distractions',
        notifications: 'Only urgent notifications',
        ai: 'Task-focused; suggest deep work periods',
        schedule: 'Extended focus blocks; limited meetings',
      },
      family: {
        planning: 'Family-inclusive; shorter work blocks',
        notifications: 'Family-related priorities',
        ai: 'Consider family time; suggest shared activities',
        schedule: 'Family blocks; flexible work periods',
      },
      holiday: {
        planning: 'Minimal planning; enjoyment-focused',
        notifications: 'Reduced to essential',
        ai: 'Suggest relaxing activities; no work pressure',
        schedule: 'Freeform; minimal structure',
      },
      deep_work: {
        planning: 'Extended focus sessions; batch shallow work',
        notifications: 'Deep work mode; silence non-critical',
        ai: 'Support deep focus; suggest pomodoro sessions',
        schedule: '2-4 hour deep work blocks; limited interruptions',
      },
      transition: {
        planning: 'Adaptive; focus on new routines',
        notifications: 'Moderate; support habit building',
        ai: 'Guide through transition; suggest next steps',
        schedule: 'Flexible; buffer time for adjustment',
      },
      emergency: {
        planning: 'Essential tasks only; pause non-critical',
        notifications: 'Emergency contacts only',
        ai: 'Support mode; focus on what matters most',
        schedule: 'Clear calendar; essential events only',
      },
    }

    return effects[mode] ?? effects.normal
  },
}
