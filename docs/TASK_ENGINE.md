# Task Engine

## 1. Overview

The Task Engine manages the creation, prioritization, scheduling, and tracking of tasks. Unlike traditional task managers where users manually enter tasks, LifeOS tasks are primarily AI-generated from goals, habits, routines, and contextual analysis. Users confirm, modify, or reject tasks — they rarely create from scratch.

---

## 2. Task Sources

| Source | Description | % of Tasks (Target) |
|---|---|---|
| **Goal decomposition** | AI breaks goals into actionable tasks | 35% |
| **Routine steps** | Scheduled routine activities | 20% |
| **Habit generation** | Habit tracking creates "do habit" tasks | 15% |
| **AI suggestion** | AI recommends tasks based on context | 10% |
| **Manual entry** | User creates task directly | 5% |
| **Calendar sync** | External events imported as tasks | 5% |
| **Delegated** | Tasks assigned by others in shared context | 5% |
| **Recurring** | User-defined recurring tasks | 5% |

---

## 3. Task Lifecycle

```
                    ┌──────────┐
                    │ Pending  │ ← AI suggests, user reviews
                    └────┬─────┘
                         │ (User approves)
                         ▼
                    ┌──────────┐
            ┌────── │ Approved │ ← Queued for scheduling
            │       └────┬─────┘
            │            │ (AI schedules)
            │            ▼
            │       ┌───────────┐
            │       │ Scheduled │ ← Has time slot
            │       └─────┬─────┘
            │             │ (Start time reached)
            │             ▼
            │        ┌───────────┐
            │        │ In Progress│
            │        └─────┬─────┘
            │              │
            │     ┌────────┼────────┐
            │     │        │        │
            ▼     ▼        ▼        ▼
        ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
        │ Comp-│ │Skip- │ │Defer-│ │Canc- │
        │leted │ │ ped  │ │ red  │ │elled │
        └──────┘ └──────┘ └──────┘ └──────┘
```

### 3.1 State Transitions

| Transition | Trigger |
|---|---|
| **Pending → Approved** | User confirms AI suggestion |
| **Approved → Scheduled** | AI assigns time slot (or manual) |
| **Scheduled → In Progress** | User starts task |
| **In Progress → Completed** | User marks done (auto-detect possible) |
| **Scheduled → Deferred** | User/AI moves to later date |
| **Approved → Deferred** | Low priority, no slot available |
| **Any → Cancelled** | Goal changes, dependency breaks |

---

## 4. Task Properties

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 1 | 2 | 3 | 4 | 5; // 1 = critical, 5 = low
  estimatedMinutes: number;
  actualMinutes?: number;
  dueDate?: Date;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  completedAt?: Date;
  source: TaskSource;
  energyRequired: 1 | 2 | 3 | 4 | 5; // 1 = very low, 5 = very high
  contextTags: string[]; // e.g., ['deep_work', 'errand', 'admin', 'creative']
  aiConfidence?: number; // 0.0 - 1.0 (for AI-generated tasks)
  recurrenceRule?: string; // RRULE format
  metadata: Record<string, any>;

  // Relationships
  goalId?: string;      // Parent goal
  projectId?: string;   // Parent project
  parentTaskId?: string; // Parent task (sub-tasks)
  dependentTaskIds: string[]; // Tasks that depend on this
  blockingTaskIds: string[];  // Tasks this depends on
}
```

---

## 5. AI Task Generation

### 5.1 Goal Decomposition

When a goal is created or activated, the AI generates supporting tasks:

```typescript
interface TaskGenerationInput {
  goalId: string;
  goalTitle: string;
  goalLevel: GoalLevel;
  goalDescription: string;
  deadline?: Date;
  currentProgress: number;
  userContext: {
    availableHours: number;
    energyPatterns: EnergyPattern[];
    existingCommitments: Commitment[];
    preferences: TaskPreference;
  };
}

interface TaskGenerationOutput {
  tasks: GeneratedTask[];
  reasoning: string; // Why these tasks were chosen
  dependencies: TaskDependency[];
  suggestedPriorities: PrioritySuggestion[];
}
```

### 5.2 Weekly Task Batch

Each week (default: Sunday evening), the AI:
1. Reviews weekly goals and their progress
2. Generates tasks needed to achieve weekly outcomes
3. Considers capacity (calendar, energy, existing commitments)
4. Balances across life domains
5. Presents the week's tasks for user approval

### 5.3 Daily Task Refinement

Each morning, the AI:
1. Reviews today's scheduled tasks
2. Adjusts based on latest context (sleep, energy, mood)
3. Reprioritizes if new information available
4. Presents a refined daily plan

---

## 6. Prioritization

### 6.1 Priority Calculation

```typescript
function calculateTaskPriority(task: Task, context: UserContext): number {
  const goalPriority = getGoalPriority(task.goalId);
  const urgencyScore = calculateUrgency(task.dueDate);
  const dependencyScore = calculateDependencyImpact(task);
  const energyMatch = calculateEnergyMatch(
    task.energyRequired,
    context.currentEnergy
  );
  const alignmentScore = calculateGoalAlignment(task, context.currentGoals);
  const timeAvailable = calculateTimeAvailable(context.freeSlots);

  return weightedScore({
    goalPriority: { value: goalPriority, weight: 0.3 },
    urgency: { value: urgencyScore, weight: 0.25 },
    dependencies: { value: dependencyScore, weight: 0.15 },
    energyMatch: { value: energyMatch, weight: 0.1 },
    alignment: { value: alignmentScore, weight: 0.1 },
    timeAvailable: { value: timeAvailable, weight: 0.1 },
  });
}
```

### 6.2 Priority Levels

| Level | Label | Meaning | Auto-Schedule |
|---|---|---|---|
| **1** | Critical | Must do today; deadline urgent | Top of schedule |
| **2** | High | Important, should do soon | Today or tomorrow |
| **3** | Normal | Standard priority | This week |
| **4** | Low | Can wait | This week or next |
| **5** | Optional | If time permits | Overflow bucket |

---

## 7. Task Grouping

### 7.1 Context-Based Grouping

The AI groups tasks by context to minimize context switching:

| Context | Examples |
|---|---|
| **Deep Work** | Writing, coding, designing, strategizing |
| **Admin** | Email, paperwork, planning, organizing |
| **Errands** | Groceries, pharmacy, post office |
| **Meetings** | Calls, 1:1s, team syncs |
| **Learning** | Reading, courses, practice |
| **Health** | Exercise, meditation, doctor |
| **Social** | Calls with friends, events |
| **Home** | Cleaning, maintenance, organizing |

### 7.2 Energy-Based Scheduling

```
High Energy Blocks (9-11 AM) → Deep Work tasks (priority 1-2)
Medium Energy (11-1 PM) → Admin, meetings
Low Energy (2-4 PM) → Errands, routine tasks
Recovery (evening) → Learning, social, personal
```

---

## 8. Batch Processing

### 8.1 Task Batching

Small tasks are batched into "power hours":

```
Admin Power Hour (30 min):
  ✓ Pay electricity bill (est. 5 min)
  ✓ Reply to email thread (est. 10 min)
  ✓ Schedule dentist appointment (est. 5 min)
  ✓ Update budget spreadsheet (est. 10 min)

Total: 30 min ✓
```

### 8.2 Task Splitting

Tasks estimated > 2 hours are split:

```
"Write project proposal" (est. 4h)
  → "Outline project proposal" (45 min)
  → "Draft introduction and background" (1h)
  → "Draft methodology section" (1h)
  → "Review and polish proposal" (45 min)
  → "Send proposal for feedback" (30 min)
```

---

## 9. Adaptive Task Adjustment

The Task Engine continuously adjusts based on:

| Input | Adjustment |
|---|---|
| **Energy drops** | Reschedule high-energy tasks, promote low-energy tasks |
| **Time overrun** | Automatically shift subsequent tasks |
| **New urgent task** | Re-prioritize, defer lower-priority tasks |
| **Task completion** | Move forward next tasks in dependency chain |
| **Missed task** | Reschedule or cancel based on dependency impact |
| **External events** | Block time in calendar, adjust task slots |
| **Goal change** | Regenerate tasks for changed goals |
| **Burnout signals** | Reduce task count, promote recovery tasks |

---

## 10. Task Templates

For recurring task patterns, the AI uses templates:

```typescript
interface TaskTemplate {
  id: string;
  name: string;
  pattern: string; // Description of when to use
  defaultTitle: string;
  defaultDuration: number;
  defaultEnergy: number;
  defaultContext: string;
  suggestsGoalConnection: boolean;
  suggestsSubTasks: boolean;
  variables: TemplateVariable[];
}
```

**Built-in templates:**
- Weekly review
- Monthly planning
- Goal check-in
- Learning session
- Exercise routine
- Meal prep
- Finance review
- Relationship check-in
- Reflection journaling

---

## 11. Analytics & Insights

| Metric | Purpose |
|---|---|
| **Task completion rate** | % of approved tasks completed |
| **Avg time estimation accuracy** | How well AI estimates task duration |
| **AI suggestion acceptance rate** | % of AI-suggested tasks approved |
| **Task source distribution** | Where tasks come from |
| **Domain balance** | % of tasks per life domain |
| **Peak productivity time** | When tasks are most often completed |
| **Energy accuracy** | How well energy requirements match reality |
| **Overdue ratio** | % of tasks past due date |

---

## 12. Related Documents

- [GOAL_SYSTEM.md](./GOAL_SYSTEM.md) — Goal decomposition into tasks
- [PLANNING_ENGINE.md](./PLANNING_ENGINE.md) — How tasks integrate with plans
- [SCHEDULING_ENGINE.md](./SCHEDULING_ENGINE.md) — Task time-slot assignment
- [ROUTINE_ENGINE.md](./ROUTINE_ENGINE.md) — Routine steps as tasks
- [AI_ENGINE.md](./AI_ENGINE.md) — Task generation AI operations
