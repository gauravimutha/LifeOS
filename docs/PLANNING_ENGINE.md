# Planning Engine

## 1. Overview

The Planning Engine is the orchestration layer that creates, maintains, and adapts the user's life plan. It integrates goals, tasks, habits, routines, calendar, health, and AI recommendations into a coherent, living plan that evolves with the user's life.

---

## 2. Planning Horizons

| Horizon | Frequency | Duration | AI Involvement |
|---|---|---|---|
| **Life Plan** | Annual | 1-5 years | Strategic guidance, vision alignment |
| **Yearly Plan** | Annual | 1 year | Goal setting, major milestones |
| **Quarterly Plan** | Quarterly | 3 months | Focus areas, key results |
| **Monthly Plan** | Monthly | 1 month | Objective breakdown, habit focus |
| **Weekly Plan** | Weekly | 1 week | Task generation, time blocking |
| **Daily Plan** | Daily | 1 day | Schedule refinement, prioritization |
| **Reactive Plan** | Real-time | Minutes-hours | Adaptation to changes |

---

## 3. Plan Structure

### 3.1 Plan Object

```typescript
interface Plan {
  id: string;
  userId: string;
  horizon: PlanningHorizon;
  period: {
    start: Date;
    end: Date;
  };
  status: 'draft' | 'active' | 'completed' | 'archived';

  // Content
  goals: PlanGoal[];      // Goals active in this period
  projects: PlanProject[]; // Projects active in this period
  tasks: PlanTask[];      // Tasks scheduled in this period
  routines: PlanRoutine[]; // Routines active in this period
  habits: PlanHabit[];    // Habits to focus on

  // Schedule
  timeBlocks: TimeBlock[]; // Scheduled time blocks
  bufferTime: number;      // Unallocated buffer (minutes/day)
  flexibilityScore: number; // 0-1, how adaptable the plan is

  // Context
  constraints: Constraint[]; // Known constraints
  assumptions: Assumption[]; // Planning assumptions
  risks: Risk[];             // Identified risks

  // Metadata
  createdBy: 'user' | 'ai' | 'hybrid';
  confidence: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 Time Block

```typescript
interface TimeBlock {
  id: string;
  startTime: Date;
  endTime: Date;
  type: 'task' | 'habit' | 'routine' | 'break' | 'buffer' | 'meeting'
    | 'focus' | 'learning' | 'social' | 'health' | 'personal' | 'travel';
  title: string;
  entityId?: string; // Reference to task/habit/routine/calendar event
  energyLevel: 'low' | 'medium' | 'high';
  isFlexible: boolean;
  isRecurring: boolean;
  metadata: Record<string, any>;
}
```

---

## 4. Planning Process

### 4.1 Annual Planning

**When:** December/January (or onboarding)
**Process:**
```
1. Vision review (user reads their vision)
2. AI presents last year's summary (if returning user)
3. User reflects on what worked, what didn't
4. AI suggests yearly goals based on:
   - Long-term goals progress
   - Life domain balance
   - Journal themes
   - Health/fitness trends
5. User confirms/modifies goals
6. AI generates quarterly milestones
7. User reviews and adjusts
8. Plan activated
```

### 4.2 Quarterly Planning

**When:** Last week of current quarter
**Process:**
```
1. Quarterly review (AI presents progress data)
2. Celebrate wins (AI highlights achievements)
3. Learn from setbacks (AI analyzes patterns)
4. Adjust yearly goals if needed
5. Set next quarter's focus areas
6. AI generates monthly objectives
7. User confirms
8. AI populates initial task pool
```

### 4.3 Weekly Planning

**When:** Sunday (configurable)
**Process:**
```
1. Weekly review
   → Completed tasks: X%
   → Goal progress: +Y%
   → Habit streaks: maintained/lost
2. Energy/mood analysis
   → Patterns identified
   → Adjustments suggested
3. Next week's priorities
   → AI generates weekly goal progress tasks
   → Calendar conflicts identified
   → Capacity check
4. User reviews and adjusts
5. AI creates draft schedule
6. User approves
```

### 4.4 Daily Planning

**When:** Morning (configurable)
**Process:**
```
1. Context gathering
   → Sleep quality, energy, mood
   → Calendar events
   → Urgent/important tasks
   → External factors (weather, news - opt-in)
2. AI generates plan proposal
   → Prioritized task list
   → Time-blocked schedule
   → Energy-aware sequencing
3. User reviews (should take < 2 min)
   → Swipe to approve task
   → Drag to reschedule
   → Tap to defer
4. Plan activated
```

---

## 5. Adaptive Planning & Safety Valves

The Planning Engine continuously adapts task execution based on energy constraints, cumulative fatigue, and task avoidance.

### 5.1 One Thing That Matters (Daily MIT Card)
At the start of each daily cycle, the planning service identifies the single highest-leverage task to focus on (the Most Important Task or MIT). The selection is calculated deterministically based on priority weights, deadlines, and task duration. The AI then appends a strategic explanation block outlining *why* this specific task matters to the user's 5-year vision, reducing decision fatigue and cognitive overhead.

### 5.2 Burnout Safety Valve & Recovery Mode
If the user's scheduled focus tasks for a single day exceed **8 hours (480 minutes)**, a Burnout Protection warning card triggers on the dashboard. The user can activate **Recovery Mode** with a single tap, which makes a call to the adaptation API (`/api/plans/generate` with `optimizeType: 'low_energy'`) to:
- Defer demanding, high-energy focus tasks.
- Protect sleep and morning energy buffers.
- Allocate structured rest and wellness time blocks.

### 5.3 Socratic Accountability Partner
When a task is repeatedly deferred, the task's `deferCount` increments. If the task has been deferred multiple times, the Socratic Accountability engine flags it:
- Renders an interactive warning prompt on the dashboard.
- Invokes supportive, curious coaching triggers ("Why does this task feel difficult to start?").
- Provides a **Simplify Task** action that splits the large, intimidating task into small, manageable 15-minute focus micro-blocks.

### 5.4 Trigger Events

The planning engine re-evaluates when:

| Trigger | Response Time | Depth | Action |
|---|---|---|---|
| **Calendar event changes** | Immediate | Shallow | Reschedule affected blocks |
| **Task deferred** | Immediate | Medium | Increment `deferCount`, check accountability thresholds |
| **New goal added** | Hours | Deep | Analyze goal conflicts & reality check compatibility |
| **Workload > 8 hours** | Immediate | Deep | Trigger Burnout Protection warning (Recovery Mode) |
| **Evening reflection logged** | Daily (after 5 PM) | Medium | Write wins, problems, and lessons to AI Memory |

### 5.5 Adaptation Strategies

| Strategy | Description | Implemented Trigger |
|---|---|---|
| **Shift** | Move time blocks forward/backward | Calendar/task overrun |
| **Simplify** | Decompose task into 15m focus micro-blocks | Socratic Accountability trigger on avoided tasks |
| **Recovery Mode** | Auto-defer high-energy tasks, secure rest buffers | Burnout threshold breach (> 8h scheduled) |
| **Defer** | Reschedule to next day/week | Low priority + low energy check |
| **Memory Sync** | Update AI patterns (wins, blockers, preferences) | Evening Reflection submission |

### 5.3 Schedule Impact Analysis

When any change occurs, the AI calculates:

```
Change: Meeting moved from 2 PM → 4 PM

Initial impact:
  - 2-4 PM block becomes free
  - 4-5 PM deep work block becomes occupied
  - 4 PM task needs rescheduling

First-order effects:
  - Task A (scheduled 4-5 PM): needs new slot → available: 2-4 PM ✓
  - Task B (depends on Task A): can stay if A moves earlier
  - Routine (evening): unaffected, start time unchanged

Second-order effects:
  - Energy profile: Task A requires high energy, 2 PM is high energy ✓
  - Task C (originally 2-3 PM): completed this morning, slot already freed ✓

Recommendation: Move Task A to 2-4 PM. No other changes needed.
```

---

## 6. Time Budgeting

### 6.1 Available Time Calculation

```typescript
function calculateAvailableTime(user: User, date: Date): TimeBudget {
  // Start with 24 hours
  const totalDay = 24 * 60; // minutes

  // Subtract non-negotiable commitments
  const sleepMinutes = user.sleepGoal * 60;
  const mealsMinutes = 90; // 3 × 30 min meals
  const personalCareMinutes = 45; // shower, dressing, etc.
  const commuteMinutes = user.commuteTime;

  // Subtract calendar events
  const calendarMinutes = getCalendarEvents(user, date)
    .filter(e => e.status === 'confirmed')
    .reduce((sum, e) => sum + (e.endTime - e.startTime) / 60000, 0);

  // Available = Total - Fixed - Calendar
  const available = totalDay - sleepMinutes - mealsMinutes
    - personalCareMinutes - commuteMinutes - calendarMinutes;

  return {
    totalAvailable: available,
    recommendedWork: available * 0.6, // 60% max for productive work
    recommendedBuffer: available * 0.15, // 15% buffer
    recommendedRest: available * 0.25, // 25% for breaks/rest
  };
}
```

### 6.2 Load Management

| Load Level | Utilization | AI Action |
|---|---|---|
| **Under-loaded** | < 50% | Suggest additional goals/tasks |
| **Optimal** | 50-70% | Maintain, standard planning |
| **Stretched** | 70-85% | Monitor, suggest deferring low-priority items |
| **High** | 85-95% | Reduce task count, increase buffers |
| **Critical** | > 95% | Trigger warning, recommend delegation/cancellation |

---

## 7. Plan Visualization

The plan is presented to the user in multiple views:

| View | Description |
|---|---|
| **Timeline** | Chronological view of time blocks |
| **Priority matrix** | Urgency × Importance quadrant view |
| **Goal progress** | Progress bars for active goals |
| **Domain radar** | Balance across life domains (radar chart) |
| **Energy map** | Task energy requirement vs. available energy |
| **Dependency graph** | Visual task dependency network |

---

## 8. Plan Quality Metrics

| Metric | Target | Measurement |
|---|---|---|
| **Plan adherence** | > 70% | % of planned time blocks honored |
| **Task completion rate** | > 80% | % of scheduled tasks completed |
| **AI suggestion accuracy** | > 85% | % of AI adjustments user keeps |
| **Buffer utilization** | 10-20% | % of time spent in buffer slots |
| **Domain balance** | Even distribution | Tasks per domain (standard deviation < 15%) |
| **Flexibility** | > 0.6 | % of time blocks marked flexible |
| **Replanning latency** | < 5 min | Time from change to updated plan |

---

## 9. Related Documents

- [GOAL_SYSTEM.md](./GOAL_SYSTEM.md) — Goals that drive planning
- [TASK_ENGINE.md](./TASK_ENGINE.md) — Tasks scheduled in plans
- [SCHEDULING_ENGINE.md](./SCHEDULING_ENGINE.md) — Time-slot optimization
- [ROUTINE_ENGINE.md](./ROUTINE_ENGINE.md) — Routines in daily plans
- [AI_ENGINE.md](./AI_ENGINE.md) — AI planning operations
- [DECISION_ENGINE.md](./DECISION_ENGINE.md) — Trade-off analysis in planning
