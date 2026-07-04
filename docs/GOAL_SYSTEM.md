# Goal System

## 1. Overview

The Goal System is the foundation of LifeOS. Every action in the system traces upward to a goal, and every goal traces upward to a vision. This ensures that all effort is purposeful and connected to what the user truly values.

---

## 2. Goal Hierarchy

```
VISION (level 0)
  │
  ├── LONG-TERM GOALS (level 1, 3-5 years)
  │     │
  │     ├── YEARLY GOALS (level 2, 1 year)
  │     │     │
  │     │     ├── QUARTERLY GOALS (level 3, 3 months)
  │     │     │     │
  │     │     │     ├── MONTHLY GOALS (level 4, 1 month)
  │     │     │     │     │
  │     │     │     │     └── WEEKLY GOALS (level 5, 1 week)
  │     │     │     │           │
  │     │     │     │           └── TASKS (generated from goals)
  │     │     │     │
  │     │     │     └── PROJECTS (multi-step initiatives)
  │     │     │
  │     │     └── HABITS (recurring behaviors)
  │     │
  │     └── ROUTINES (structured sequences)
  │
  └── Values (cross-cutting, inform all goals)
```

### 2.1 Level Definitions

| Level | Horizon | Quantity (Recommended) | Description |
|---|---|---|---|
| **Vision** | Lifetime | 1 | The user's personal mission statement / ideal life |
| **Long-Term** | 3-5 years | 3-5 | Major life domains to transform |
| **Yearly** | 1 year | 3-8 | Annual priorities |
| **Quarterly** | 3 months | 2-5 | Quarterly focus areas |
| **Monthly** | 1 month | 2-4 | Monthly objectives |
| **Weekly** | 1 week | 2-5 | Weekly outcomes |
| **Tasks** | Daily | 3-8 | Daily actionable items |

---

## 3. Life Domains

Goals should be balanced across life domains. The AI uses these domains to check for balance:

| Domain | Description | Default Weight |
|---|---|---|
| **Health & Fitness** | Physical health, exercise, nutrition, sleep | High |
| **Mental & Emotional** | Mindfulness, therapy, stress management, joy | High |
| **Relationships** | Family, partner, friends, community | High |
| **Career & Work** | Professional growth, projects, performance | Medium |
| **Learning & Growth** | Skills, education, reading, curiosity | Medium |
| **Finance** | Income, savings, investments, budgeting | Medium |
| **Creativity & Passion** | Creative projects, hobbies, self-expression | Medium |
| **Home & Environment** | Living space, organization, sustainability | Low |
| **Spirituality & Meaning** | Purpose, faith, values, contribution | Low |
| **Adventure & Experience** | Travel, new experiences, fun | Low |

---

## 4. Goal Lifecycle

### 4.1 States

```
                   ┌──────────┐
                   │  Draft   │
                   └────┬─────┘
                        │ (AI refines with user)
                        ▼
                   ┌──────────┐
            ┌───── │  Active  │ ─────┐
            │      └──────────┘      │
            ▼                        ▼
       ┌────────┐            ┌───────────┐
       │ Paused │            │ Completed │
       └────────┘            └─────┬─────┘
            │                      │
            ▼                      ▼
       ┌──────────┐          ┌──────────┐
       │ Cancelled│          │ Archived │
       └──────────┘          └──────────┘
```

| State | Description |
|---|---|
| **Draft** | Initial creation, AI helps refine wording, scope, and connect to parent |
| **Active** | In progress, being tracked and worked on |
| **Paused** | Temporarily on hold (user or AI determined); preserved with notes |
| **Completed** | Successfully achieved |
| **Cancelled** | No longer relevant or desired |
| **Archived** | Past goal, preserved for reference |

### 4.2 Transitions

- **Draft → Active:** User confirms the goal; AI sets initial sub-goals
- **Active → Paused:** User action or AI suggestion (e.g., bandwidth issues)
- **Active → Completed:** Goal reached; AI celebrates and suggests next
- **Paused → Active:** User decides to resume
- **Active → Cancelled:** User decides it's not right; AI logs why
- **Completed → Archived:** Auto-archived after 30 days
- **Cancelled:** Immediate archive

---

## 5. Goal Creation & Feasibility Checks

### 5.1 Manual & AI-Assisted Creation
When a goal is initialized, the system runs a deterministic audit before calling the AI Gateway. This audit checks if the user already has too many active goals (bandwidth capacity limit). 

### 5.2 AI Reality Check & Conflict Detection
The **Goal Analysis Service** (`src/services/ai/goalAnalysisService.ts`) runs a cross-goal conflict check:
- **Active Goal Sync**: Pulls existing active goals of the user.
- **Overlap Analysis**: Detects timeline, topic, or scheduling overlaps (e.g. preparing for placement exams while building a startup and learning guitar simultaneously).
- **Workload Estimation**: Checks if the weekly hours required exceed available buffers.
- **Goal AI Analysis Schema**:
  ```typescript
  export interface GoalAIAnalysis {
    category: string
    priority: 'low' | 'medium' | 'high'
    difficulty: 'easy' | 'medium' | 'hard'
    estimatedDuration: string
    weeklyCommitment: number // hours/week
    successMetrics: string[]
    milestones: { title: string; description: string; targetDate: string }[]
    realityCheck: string // AI qualitative feasibility explanation
    conflicts: string[] // List of conflicting goal names
  }
  ```

### 5.3 UX & Goal Warnings
If conflicts or bandwidth issues are detected:
- The analysis returns `conflicts` and `realityCheck` details.
- A warning notification banner renders at the top of the Goal Details page (`GoalDetail.tsx`) alerting the user with actionable advice (e.g. "You have 5 active goals. We recommend pausing learning guitar until your exam prep concludes in September.").

---

## 6. Goal Properties

### 6.1 SMART+ Framework

Goals follow the SMART+ framework:

| Criterion | Description | AI Role |
|---|---|---|
| **Specific** | Clear, unambiguous outcome | Helps refine vague wording |
| **Measurable** | Quantifiable progress | Suggests metrics and tracking |
| **Achievable** | Realistic given constraints | Analyzes bandwidth, resources |
| **Relevant** | Aligned with higher goals/values | Validates connection to vision |
| **Time-bound** | Clear deadline or horizon | Suggests realistic timeline |
| **+ Balanced** | Considers other domains | Checks for domain balance |

### 6.2 Progress Tracking

```typescript
interface GoalProgress {
  goalId: string;
  current: number;   // Current value
  target: number;    // Target value
  unit: string;       // '%', 'kg', 'sessions', 'pages', etc.
  trend: 'up' | 'down' | 'flat' | 'fluctuating';
  velocity: number;  // Rate of change (per week)
  projectedCompletion: Date | null;
  lastUpdated: Date;
}
```

**Progress sources:**
- **Task completion:** % of associated tasks completed
- **Habit tracking:** Habit consistency for health goals
- **Manual check-in:** User self-reports progress
- **External data:** Weight, fitness, financial API data
- **Journal analysis:** Sentiment and theme analysis
- **AI estimation:** For goals without direct metrics

---

## 7. Goal Review Cadence

| Frequency | Focus | AI Action |
|---|---|---|
| **Daily** | Task-level alignment | Check today's tasks support weekly goals |
| **Weekly** | Weekly goals, habit streaks | Generate weekly review; suggest adjustments |
| **Monthly** | Monthly goals, progress trends | Deep analysis; rebalancing recommendations |
| **Quarterly** | Quarterly goals, major milestones | Full review; celebrate wins; adjust next quarter |
| **Yearly** | Yearly + long-term goals | Annual retrospective; vision check |
| **Life transition** | Vision-level | Triggered by major life changes |

---

## 8. AI Goal Operations

### 8.1 Goal Parsing

When a user expresses a desire (in chat, journal, or directly), the AI:

```
User: "I want to get in better shape"

AI parsing:
1. Level detection → "yearly" (likely)
2. Domain → "health & fitness"
3. SMART refinement → "What does 'better shape' mean to you?"
4. Connection → "How does this connect to your vision?"
5. Balance check → "Any other domains to deprioritize?"
6. Sub-goal generation → Monthly milestones
```

### 8.2 Goal Decomposition

The AI automatically decomposes goals into actionable components:

```
Yearly Goal: "Run a half marathon"
  ├── Quarterly: "Build base to 10K"
  │     ├── Monthly: "Run 3x/week, reach 5K"
  │     │     ├── Weekly: "Run M/W/F, 20 min"
  │     │     │     └── Tasks: "Run Mon morning", "Run Wed lunch"
  │     │     └── Habit: "Stretch after runs"
  │     ├── Monthly: "Reach 8K"
  │     └── Monthly: "Reach 10K"
  ├── Quarterly: "Speed work + distance to 15K"
  └── Quarterly: "Taper + race prep"
```

### 8.3 Goal Conflict Detection

The AI identifies when goals compete:

1. **Time conflict:** "Study for certification" and "Train for marathon" both need 5+ hours/week
2. **Energy conflict:** "Wake at 5 AM for meditation" and "Late networking events"
3. **Resource conflict:** "Save $10K" and "Travel to 3 countries"
4. **Cognitive conflict:** "Deep work on side project" and "Be present with family"

**Resolution strategies:**
- Repurpose: Shift timeline
- Reduce: Scale back scope
- Reschedule: Move to different quarter
- Remove: Decide which matters more
- Combine: Find synergy (e.g., running with friend = fitness + relationship)

### 8.4 Goal Scoring

```typescript
interface GoalScore {
  overall: number; // 0-100
  clarity: number;    // How well-defined
  achievability: number; // Given current context
  alignment: number;  // Connection to vision/values
  balance: number;    // Domain balance consideration
  momentum: number;   // Current progress velocity
  sustainability: number; // Long-term maintainability
}
```

---

## 9. Related Documents

- [TASK_ENGINE.md](./TASK_ENGINE.md) — How goals generate tasks
- [PLANNING_ENGINE.md](./PLANNING_ENGINE.md) — How goals inform planning
- [AI_ENGINE.md](./AI_ENGINE.md) — AI goal operations
- [ENTITY_RELATIONSHIP.md](./ENTITY_RELATIONSHIP.md) — Goal hierarchy data model
