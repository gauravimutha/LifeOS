# Scheduling Engine

## 1. Overview

The Scheduling Engine is responsible for assigning tasks and activities to specific time slots in the user's day. It optimizes for energy patterns, deadlines, dependencies, and life balance. It is triggered by the Planning Engine and operates in real-time as conditions change.

---

## 2. Scheduling Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Scheduling Engine                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  Time Slot   │  │  Task        │  │  Constraint      │ │
│  │  Manager     │  │  Fitter      │  │  Solver          │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  Energy      │  │  Dependency  │  │  Optimization    │ │
│  │  Scheduler   │  │  Resolver    │  │  Engine          │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Calendar Integration (read external, write internal) │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Core Concepts

### 3.1 Time Slots

```typescript
interface TimeSlot {
  start: Date;
  end: Date;
  duration: number; // minutes
  type: 'available' | 'busy' | 'tentative' | 'blocked';
  source: 'calendar' | 'routine' | 'habit' | 'generated' | 'buffer';
  energyLevel: 'low' | 'medium' | 'high';
  isOptimal: boolean; // AI's preferred time for this type of work
}
```

### 3.2 Energy Model

The Scheduling Engine maintains an energy curve for each day:

```typescript
interface EnergyCurve {
  date: Date;
  baseLevel: number; // 0-100, from sleep data
  timeSlots: {
    hour: number; // 0-23
    predictedEnergy: number; // 0-100
    confidence: number; // 0-1
  }[];
  factors: {
    sleepQuality: number;
    exerciseImpact: number;
    mealTiming: number;
    stressLevel: number;
    historicalPattern: number;
  };
}
```

**Default energy archetypes (learned over time):**

| Archetype | Peak | Trough | Recovery |
|---|---|---|---|
| **Morning Lark** | 6-10 AM | 1-3 PM | 4-6 PM |
| **Night Owl** | 2-6 PM | 6-9 AM | 8-11 PM |
| **Bimodal** | 8-11 AM, 4-7 PM | 1-3 PM | Evening |
| **Steady** | Consistent throughout | Gradual dip | Stable |
| **Erratic** | Varies daily | Unpredictable | Pattern detection in progress |

---

## 4. Scheduling Algorithm

### 4.1 Daily Schedule Construction

```
INPUT:
  - Tasks to schedule (with priority, energy need, duration)
  - Calendar events (fixed time blocks)
  - Routines (preferred time windows)
  - Habits (preferred time windows)
  - Energy curve
  - User preferences

ALGORITHM:
1. Block calendar events (fixed, non-movable)
2. Block routines (semi-fixed, movable if flexible)
3. Block habits (semi-fixed, movable)
4. Schedule breaks (mandatory: one every 90 min, meal times)
5. Schedule priority 1 tasks:
   a. Match energy requirement to energy curve
   b. Place in highest energy match slot
   c. Respect task dependencies
6. Schedule priority 2-3 tasks (repeat 5)
7. Schedule priority 4-5 tasks (fill remaining slots)
8. Add buffer time (15% of productive time)
9. Optimize for flow state (minimize context switching)
10. Validate constraints
```

### 4.2 Task-to-Energy Matching

```typescript
function assignEnergyLevel(task: Task): 'low' | 'medium' | 'high' {
  if (task.energyRequired <= 2) return 'low';
  if (task.energyRequired <= 3) return 'medium';
  return 'high';
}

function findOptimalSlot(
  task: Task,
  availableSlots: TimeSlot[],
  energyCurve: EnergyCurve
): TimeSlot | null {
  const neededEnergy = assignEnergyLevel(task);

  // Filter slots that can accommodate the task
  const candidateSlots = availableSlots.filter(slot =>
    slot.duration >= task.estimatedMinutes &&
    slot.energyLevel === neededEnergy &&
    slot.isOptimal
  );

  if (candidateSlots.length > 0) {
    // Pick earliest optimal slot
    return candidateSlots.sort((a, b) => a.start.getTime() - b.start.getTime())[0];
  }

  // Fall back to any sufficient slot
  const anySlots = availableSlots.filter(slot =>
    slot.duration >= task.estimatedMinutes
  );

  return anySlots.sort((a, b) => a.start.getTime() - b.start.getTime())[0] || null;
}
```

### 4.3 Dependency Resolution

```typescript
function resolveDependencies(tasks: Task[]): Task[][] {
  // Build dependency graph
  // Topological sort
  // Return ordered layers of parallelizable tasks
  const adjacencyList = buildDependencyGraph(tasks);
  const inDegree = calculateInDegree(adjacencyList);
  const layers: Task[][] = [];

  while (Object.keys(adjacencyList).length > 0) {
    const currentLayer = adjacencyList
      .filter((_, id) => inDegree[id] === 0)
      .map(id => tasks.find(t => t.id === id)!);

    if (currentLayer.length === 0) break; // Circular dependency

    layers.push(currentLayer);

    // Remove processed nodes
    currentLayer.forEach(task => {
      delete adjacencyList[task.id];
      Object.keys(adjacencyList).forEach(id => {
        if (adjacencyList[id].includes(task.id)) {
          inDegree[id]--;
        }
      });
    });
  }

  return layers;
}
```

---

## 5. Scheduling Rules

### 5.1 Hard Rules (Never Violated)

1. **Calendar events are sacred** — fixed external commitments are never moved
2. **Minimum 7 hours for sleep** — sleep time is non-negotiable
3. **Break every 90 minutes** — mandatory 10-15 minute break after each 90-min focus block
4. **Meal times** — at least 30 minutes for each meal
5. **No double-booking** — one activity at a time
6. **Buffer minimum** — at least 10% of productive time unallocated

### 5.2 Soft Rules (Optimized Where Possible)

1. **Morning for deep work** — high-energy tasks in the first 4 hours
2. **Afternoon for meetings** — medium-energy collaborative work
3. **Evening for reflection** — low-energy personal activities
4. **Batch similar tasks** — minimize context switching
5. **Hard tasks first** — hardest task of the day before lunch
6. **Protect focus time** — no meetings during designated deep work blocks

---

## 6. Real-Time Scheduling

### 6.1 Live Adjustment

As the user progresses through the day, the scheduler:

1. **Tracks actual completion time** vs. estimated
2. **Detects when task takes longer** → shifts subsequent tasks
3. **Detects early completion** → pulls forward next task or inserts break
4. **Monitors energy in real-time** (via wearables or manual check-ins) → adjusts remaining schedule
5. **Responds to new calendar invites** → recalculates availability

### 6.2 Schedule Commit

To prevent overwhelming the user with constant changes:

```
Commit Model:
  - Next 2 hours: "Committed" — will not change unless critical
  - 2-6 hours: "Tentative" — may shift slightly
  - 6+ hours: "Flexible" — can be significantly reshaped
  - Future days: "Planned" — full flexibility
```

---

## 7. Multi-Day Scheduling

### 7.1 Task Spreading

Tasks are spread across the week to maintain balance:

```typescript
function spreadTasksAcrossWeek(tasks: Task[], week: Week): DaySchedule[] {
  // Group tasks by priority
  // Distribute critical tasks across different days
  // Consider:
  //   - Each day should have 3-8 tasks max
  //   - Each day should have a mix of energy levels
  //   - No two heavy cognitive load days in a row
  //   - Learning/recovery days after high-output days
  //   - Weekends are lighter (if not explicitly planned)
  // Return daily schedules
}
```

### 7.2 Week Themes

Each day can have a theme for better focus:

| Day | Theme | Task Mix |
|---|---|---|
| Monday | Planning & Deep Work | High-energy, strategic |
| Tuesday | Creation | Creative, project work |
| Wednesday | Collaboration | Meetings, calls, reviews |
| Thursday | Focus | Deep work, complex tasks |
| Friday | Completion & Admin | Finish tasks, light work |
| Saturday | Growth & Play | Learning, hobbies, social |
| Sunday | Rest & Plan | Recovery, reflection, planning |

---

## 8. Time Block Types

| Block Type | Duration | Flexibility | Purpose |
|---|---|---|---|
| **Deep Work** | 90-120 min | Low | Focused, high-value work |
| **Standard** | 30-60 min | Medium | Regular tasks |
| **Quick** | 5-15 min | High | Small tasks, replies |
| **Meeting** | Variable | None (external) | Scheduled calls/meetings |
| **Routine** | Variable | Low-Medium | Daily/weekly rituals |
| **Break** | 10-15 min | High | Rest, recharge |
| **Buffer** | 15-30 min | High | Overflow, unexpected |
| **Learning** | 30-60 min | Medium | Skill development |
| **Health** | 20-60 min | Medium | Exercise, meditation |
| **Social** | 30-120 min | Medium | Relationships |
| **Personal** | 15-30 min | Low | Hygiene, meals, commute |

---

## 9. Conflict Resolution

When scheduling conflicts arise:

```typescript
interface SchedulingConflict {
  type: 'overlap' | 'overflow' | 'energy_mismatch' | 'dependency_loop';
  entities: string[]; // Conflicting task/event IDs
  severity: 'minor' | 'moderate' | 'critical';
  resolutionOptions: {
    action: 'reschedule' | 'defer' | 'compress' | 'cancel' | 'split';
    description: string;
    impact: string;
  }[];
}
```

**Resolution priority:**
1. Shift flexible tasks
2. Compress low-energy tasks
3. Defer low-priority tasks
4. Split large tasks
5. Suggest deferring medium-priority tasks
6. Escalate to user for critical conflicts

---

## 10. Learning & Optimization

The Scheduling Engine learns from user behavior:

| Signal | What It Learns |
|---|---|
| **Task takes longer than estimated** | Adjust time estimates for similar tasks |
| **User reschedules to different time** | Update energy model |
| **User completes tasks early** | Reduce time estimates |
| **User skips certain time blocks** | Re-evaluate energy model for that time |
| **User works through breaks** | Increase break reminders, suggest root cause |
| **Productive vs. unproductive days** | Identify factors that predict good/bad days |

---

## 11. Related Documents

- [PLANNING_ENGINE.md](./PLANNING_ENGINE.md) — Higher-level planning orchestration
- [TASK_ENGINE.md](./TASK_ENGINE.md) — Task definitions and priorities
- [ROUTINE_ENGINE.md](./ROUTINE_ENGINE.md) — Routine scheduling
- [AI_ENGINE.md](./AI_ENGINE.md) — AI-driven scheduling decisions
- [LIFE_MODES.md](./LIFE_MODES.md) — Mode-based scheduling adjustments
