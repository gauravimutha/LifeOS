# Life Modes

## 1. Overview

Life Modes allow LifeOS to adapt its behavior based on the user's current life situation. A mode changes planning priorities, AI personality, notifications, and available features.

---

## 2. Available Modes

| Mode | Primary Context | AI Personality Shift |
|---|---|---|
| **Normal** | Day-to-day life | Balanced (default) |
| **Travel** | Vacation or business trip | Relaxed, exploratory |
| **Recovery** | Illness, burnout, or low energy | Gentle, supportive |
| **Focus** | Important deadline or project | Direct, strategic |
| **Family** | Family events, time with children | Warm, inclusive |
| **Holiday** | Public holidays, celebrations | Light, celebratory |
| **Deep Work** | Extended focus period | Minimal interruptions |
| **Transition** | Major life change (move, new job) | Supportive, planning-focused |
| **Emergency** | Crisis or urgent situation | Calm, action-oriented |

---

## 3. Mode Configuration

### 3.1 Auto-Detection

The AI detects the appropriate mode based on:

| Signal | Mode |
|---|---|
| Calendar has "vacation" or "travel" events | Travel |
| Health data: low energy + poor sleep for 3+ days | Recovery |
| Calendar has holiday event | Holiday |
| User has a major deadline approaching | Focus |
| Burnout indicators triggered | Recovery |
| Journal mentions "crisis" or "emergency" | Emergency |
| Calendar shows family events/blocked time | Family |
| User creates a "focus session" block | Deep Work |
| User mentions major life change in journal | Transition |

### 3.2 Manual Override

Users can always:
1. Set a specific mode manually
2. Schedule mode changes ("Next week is travel mode")
3. Set mode duration ("Focus mode until Friday")
4. Create custom modes with specific configurations

### 3.3 Mode Scheduling

```typescript
interface ModeSchedule {
  id: string;
  userId: string;
  mode: LifeMode;
  startTime: Date;
  endTime?: Date;
  recurring?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  daysOfWeek?: number[]; // For weekly recurring
  autoDetect: boolean;   // Whether to auto-enter this mode
  priority: number;      // Higher priority overrides lower
  settings: ModeSettings;
}
```

---

## 4. Mode Effects

### 4.1 Planning Changes

| Mode | Task Volume | Task Types | Schedule |
|---|---|---|---|
| **Normal** | Standard | Balanced | Normal |
| **Travel** | 50% | Exploration, relaxation | Flexible, minimal |
| **Recovery** | 30% | Rest, recovery, health | Very flexible |
| **Focus** | 120% | Project-specific | Rigid, protected |
| **Family** | 70% | Family, shared activities | Family-aligned |
| **Holiday** | 30% | Celebration, rest | Open |
| **Deep Work** | 100% | Single project focus | Protected blocks |
| **Transition** | 60% | Planning, organization | Flexible |
| **Emergency** | 10% | Critical only | Immediate |

### 4.2 Notification Changes

| Mode | Notification Frequency | Notification Types |
|---|---|---|
| **Normal** | Standard | All types |
| **Travel** | Reduced | Essential only (flights, hotels) |
| **Recovery** | Minimal | Only urgent; encouragement |
| **Focus** | Reduced | Project-related only |
| **Family** | Reduced | Family-related; urgent work |
| **Holiday** | Minimal | Celebrations; essential |
| **Deep Work** | Blocked | None during focus blocks |
| **Transition** | Standard | Task-oriented |
| **Emergency** | Critical only | Essential actions |

### 4.3 AI Personality Changes

| Mode | Personality Weighting |
|---|---|
| **Travel** | More friend (30%), less executive assistant (15%) |
| **Recovery** | More caring guide (35%), less accountability (5%) |
| **Focus** | More strategic advisor (35%), more accountability (20%) |
| **Family** | More friend (25%), warmer tone |
| **Emergency** | More executive assistant (50%), direct and clear |

---

## 5. Mode Conflicts

When multiple modes could apply, the resolution priority is:

1. **Emergency** (highest priority)
2. **Recovery**
3. **Focus** / **Deep Work**
4. **Travel** / **Family** / **Holiday**
5. **Transition**
6. **Normal** (default)

---

## 6. Custom Modes

Advanced users can create custom modes:

```typescript
interface CustomMode {
  name: string;
  icon: string;
  color: string;
  taskVolume: number;        // % of normal
  taskTypes: string[];       // Task context types
  notificationFilter: NotificationRule[];
  aiPersonalityOverride: Partial<AIPersonalityWeights>;
  scheduleOverrides: SchedulePreference[];
  recoveryFocus: string[];   // Domains to prioritize
}
```

---

## 7. Related Documents

- [AI_PERSONALITY.md](./AI_PERSONALITY.md) — Mode-specific personality shifts
- [PLANNING_ENGINE.md](./PLANNING_ENGINE.md) — How modes affect planning
- [SCHEDULING_ENGINE.md](./SCHEDULING_ENGINE.md) — Schedule adjustments per mode
- [AI_ENGINE.md](./AI_ENGINE.md) — AI context awareness of current mode
