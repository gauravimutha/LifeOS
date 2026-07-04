'use client'

import type { Task } from '@/types/task'
import { TaskCard } from './task-card'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'

interface TaskListProps {
  tasks: Task[]
  onToggle?: (id: string) => void
  onTaskClick?: (task: Task) => void
  groupBy?: 'priority' | 'status' | 'category'
  emptyMessage?: string
  className?: string
}

const groupLabels: Record<string, string> = {
  urgent: 'Urgent',
  high: 'High Priority',
  medium: 'Medium Priority',
  low: 'Low Priority',
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
}

const groupOrders = ['urgent', 'high', 'medium', 'low', 'pending', 'in-progress', 'completed']

export function TaskList({ tasks, onToggle, onTaskClick, groupBy, emptyMessage, className }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <Card padding="lg" variant="ghost">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-text-tertiary">{emptyMessage ?? 'No tasks yet'}</p>
        </div>
      </Card>
    )
  }

  if (!groupBy) {
    return (
      <div className={cn('space-y-1', className)}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onToggle={onToggle} onClick={onTaskClick} showGoal />
        ))}
      </div>
    )
  }

  const grouped: Record<string, Task[]> = {}
  tasks.forEach((task) => {
    const key = task[groupBy]
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(task)
  })

  return (
    <div className={cn('space-y-4', className)}>
      {groupOrders
        .filter((key) => grouped[key])
        .map((key) => (
          <div key={key}>
            <h3 className="neo-label mb-2">{groupLabels[key] ?? key} ({grouped[key].length})</h3>
            <div className="space-y-1">
              {grouped[key].map((task) => (
                <TaskCard key={task.id} task={task} onToggle={onToggle} onClick={onTaskClick} showGoal />
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}
