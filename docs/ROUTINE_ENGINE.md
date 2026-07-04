# Routine Engine

## 1. Overview

The Routine Engine manages structured sequences of activities that recur on a regular basis. Routines provide stability, reduce decision fatigue, and ensure important non-negotiable activities happen consistently.

Unlike tasks (which are dynamic and goal-driven), routines are structural — they form the backbone of the user's day.

---

## 2. Routine Types

| Type | Example | Flexibility | Duration |
|---|---|---|---|
| **Morning** | Wake, meditate, exercise, shower, breakfast | Low | 30-90 min |
| **Afternoon** | Lunch walk, review, planning | Medium | 15-45 min |
| **Evening** | Dinner, family time, reflection | Low | 60-120 min |
| **Night** | Wind down, journal, read, sleep prep | Low | 30-60 min |
| **Work** | Daily standup, focus blocks, email review | Medium | Work hours |
| **Focus** | Pomodoro sessions, deep work blocks | Medium | 25-90 min |
| **Creative** | Music practice, writing, drawing | Medium | 30-120 min |
| **Exercise** | Gym routine, run, yoga, stretch | Medium | 20-60 min |
| **Learning** | Read, course work, practice | Medium | 20-60 min |
| **Social** | Family dinner, friend call, date night | Medium | 30-180 min |
| **Custom** | User-defined | User-defined | User-defined |

---

## 3. Routine Structure

### 3.1 Routine Definition

```typescript
interface Routine {
  id: string;
  userId: string;
  title: string;
  description?: string;
  routineType: RoutineType;
  timeOfDay?: string; // Preferred start time (HH:MM)
  durationMinutes: number;
  daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  isFlexible: boolean; // Can be shifted within a window
  flexibleWindow?: number; // Minutes before/after preferred time
  status: 'active' | 'paused' | 'archived';

  // AI learning
  adherenceRate: number; // % of scheduled occurrences completed
  preferredTime?: string; // Learned from user behavior
  adaptiveSchedule: boolean; // AI adjusts timing based on patterns

  steps: RoutineStep[];
  metadata: Record<string, any>;
}
```

### 3.2 Routine Step

```typescript
interface RoutineStep {
  id: string;
  routineId: string;
  title: string;
  description?: string;
  stepOrder: number;
  durationMinutes: number;
  taskId?: string; // Generated task reference
  isOptional: boolean; // Can be skipped
  metadata: Record<string, any>;
}
```

---

## 4. Routine Scheduling

### 4.1 Schedule Logic

```
Morning Routine (6:30-7:30 AM, Daily, Flexible: No)
├── Step 1: Wake up (5 min, optional: false)
├── Step 2: Drink water (2 min, optional: false)
├── Step 3: Meditate (10 min, optional: false)
├── Step 4: Exercise (20 min, optional: true)
├── Step 5: Shower (10 min, optional: false)
├── Step 6: Breakfast (15 min, optional: false)
└── Step 7: Plan day (8 min, optional: false)
```

### 4.2 Adaptive Timing

The AI learns optimal routine timing:

```typescript
function learnOptimalRoutineTime(routine: Routine, history: RoutineLog[]): string {
  // Analyze completion rates at different times
  const timeBuckets = groupByTimeOfDay(history);

  // Find time window with highest completion + positive mood
  const bestTime = timeBuckets
    .filter(b => b.count >= 5) // Minimum sample
    .sort((a, b) => (b.completionRate * b.avgMood) - (a.completionRate * a.avgMood))
    [0];

  return bestTime?.timeSlot || routine.timeOfDay;
}
```

### 4.3 Conflict Resolution

When routines overlap with other scheduled items:

1. **Flexible routine + fixed event** → Shift routine within window
2. **Fixed routine + fixed event** → Notify user of conflict
3. **Flexible routine + flexible routine** → Priority-based resolution
4. **Routine + task** → Task defers (routine is structural)

---

## 5. Routine Lifecycle

```
                    ┌──────────┐
                    │ Proposed │ ← AI suggests new routine
                    └─────┬────┘
                          │ (User accepts)
                          ▼
                    ┌──────────┐
                    │  Active  │ ─────────────┐
                    └─────┬────┘              │
                          │                   │
                    ┌─────┴─────┐             │
                    │           │             │
                    ▼           ▼             ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ Modified │ │ Skipped  │ │ Paused   │
              │ (by user │ │ (by user)│ │ (AI      │
              │  or AI)  │ │          │ │ detected)│
              └──────────┘ └──────────┘ └──────────┘
                                          │
                                          ▼
                                     ┌──────────┐
                                     │ Archived  │
                                     └──────────┘
```

| State | Description |
|---|---|
| **Proposed** | AI suggests based on user behavior/needs |
| **Active** | Routinely scheduled and executed |
| **Modified** | User or AI adjusted timing/steps |
| **Paused** | Temporarily inactive (AI detects pattern: travel, illness, burnout) |
| **Archived** | No longer relevant |

---

## 6. AI Routine Operations

### 6.1 Routine Suggestions

The AI suggests routines based on:

| Signal | Suggested Routine |
|---|---|
| User journal: "I want to meditate" | Morning/evening meditation routine |
| User skips breakfast frequently | Morning routine with meal prep step |
| Low energy in afternoons | Afternoon walk/break routine |
| Poor sleep quality | Night wind-down routine |
| Inconsistent work schedule | Work start/end routines |
| User mentions "want to read more" | Evening reading routine |
| Fitness goals detected | Exercise routine integration |

### 6.2 Routine Optimization

The AI continuously optimizes:

1. **Timing** — Adjust start times based on completion rates
2. **Duration** — Lengthen/shorten steps based on actual time spent
3. **Order** — Reorder steps for better flow
4. **Composition** — Add/remove steps based on relevance
5. **Flexibility** — Adjust flexibility windows based on schedule conflicts

### 6.3 Routine Pattern Detection

```typescript
interface RoutinePattern {
  routineId: string;
  adherenceTrend: 'improving' | 'declining' | 'stable';
  optimalTime?: string; // Best time for this routine
  commonSkips: string[]; // Steps most often skipped
  commonExtensions: string[]; // Steps that routinely take longer
  disruptionFactors: string[]; // What disrupts this routine (e.g., late meetings)
  suggestion?: string; // How to improve
}
```

---

## 7. Routine Analytics

| Metric | Purpose |
|---|---|
| **Adherence rate** | % of scheduled routines completed |
| **Optimal timing** | When the routine is most likely to be completed |
| **Step completion** | Which steps are consistently skipped |
| **Duration accuracy** | How well estimated vs. actual time aligns |
| **Mood impact** | Correlation between routine completion and mood |
| **Goal correlation** | Impact of routine adherence on goal progress |
| **Disruption triggers** | What causes routine breaks |

## 8. Related Documents

- [SCHEDULING_ENGINE.md](./SCHEDULING_ENGINE.md) — How routines are scheduled
- [PLANNING_ENGINE.md](./PLANNING_ENGINE.md) — How routines fit into plans
- [TASK_ENGINE.md](./TASK_ENGINE.md) — How routine steps generate tasks
- [AI_ENGINE.md](./AI_ENGINE.md) — AI routine suggestions and optimization
- [GOAL_SYSTEM.md](./GOAL_SYSTEM.md) — How routines support goals
