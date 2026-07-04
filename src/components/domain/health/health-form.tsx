'use client'

import { useState, type FormEvent } from 'react'
import { Card, Button, Input } from '@/components/ui'
import { Loader2 } from 'lucide-react'

interface HealthFormProps {
  onSubmit: (data: { sleepHours: number; energyLevel: number; moodLevel: number; stressLevel?: number; exerciseMinutes?: number }) => Promise<void>
}

export function HealthForm({ onSubmit }: HealthFormProps) {
  const [sleepHours, setSleepHours] = useState('7')
  const [energyLevel, setEnergyLevel] = useState('5')
  const [moodLevel, setMoodLevel] = useState('5')
  const [stressLevel, setStressLevel] = useState('5')
  const [exerciseMinutes, setExerciseMinutes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        sleepHours: Number(sleepHours),
        energyLevel: Number(energyLevel),
        moodLevel: Number(moodLevel),
        stressLevel: Number(stressLevel),
        exerciseMinutes: exerciseMinutes ? Number(exerciseMinutes) : undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card padding="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-sm font-bold">Log Health</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Sleep (hours)" type="number" min={0} max={24} step={0.5} value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} />
          <Input label="Exercise (min)" type="number" min={0} max={480} value={exerciseMinutes} onChange={(e) => setExerciseMinutes(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="neo-label block mb-1">Energy: {energyLevel}</label>
            <input type="range" min={1} max={10} value={energyLevel} onChange={(e) => setEnergyLevel(e.target.value)} className="w-full accent-accent" />
          </div>
          <div>
            <label className="neo-label block mb-1">Mood: {moodLevel}</label>
            <input type="range" min={1} max={10} value={moodLevel} onChange={(e) => setMoodLevel(e.target.value)} className="w-full accent-accent" />
          </div>
          <div>
            <label className="neo-label block mb-1">Stress: {stressLevel}</label>
            <input type="range" min={1} max={10} value={stressLevel} onChange={(e) => setStressLevel(e.target.value)} className="w-full accent-accent" />
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting} size="sm">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Log Health
        </Button>
      </form>
    </Card>
  )
}
