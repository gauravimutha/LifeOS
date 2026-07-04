# Component Library

## 1. Overview

This document catalogs all reusable UI components in the LifeOS design system. Components are built with Next.js (App Router), TypeScript, Tailwind CSS, and shadcn/ui as the foundation.

---

## 2. Component Hierarchy

```
Layout
├── AppShell (sidebar + topbar + content)
├── Sidebar (navigation)
├── TopBar (global actions)
├── BottomBar (mobile navigation)
└── ContentArea (main content wrapper)

Data Display
├── Card
├── CardGroup
├── List
├── Table
├── Timeline
├── Calendar
├── Graph (Life Graph visualization)
├── Tree (Goal hierarchy tree)
└── Stat (metric display)

AI Components
├── AIChat (conversation interface)
├── AISuggestionCard (recommendation)
├── AIBriefing (daily briefing)
├── AIReasoning (explanation expandable)
├── AIFeedback (rating widget)
├── AIAnalysis (data analysis display)
└── AITypingIndicator

Goal Components
├── GoalCard
├── GoalTree
├── GoalProgress
├── GoalForm
├── GoalHierarchy
└── GoalScore

Task Components
├── TaskCard
├── TaskList
├── TaskItem
├── TaskForm
├── TaskKanban
├── TaskGantt
├── TaskDependencyGraph
└── TaskPriorityBadge

Plan Components
├── DailyPlan
├── WeeklyPlan
├── MonthlyPlan
├── TimeBlock
├── ScheduleGrid
├── EnergyCurve
└── PlanTimeline

Habit Components
├── HabitCard
├── HabitTracker
├── HabitStreak
├── HabitCalendar
└── HabitForm

Routine Components
├── RoutineCard
├── RoutineStep
├── RoutineTimeline
└── RoutineForm

Journal Components
├── JournalEntry
├── JournalList
├── JournalForm
└── JournalInsight

Health Components
├── HealthCard
├── HealthChart
├── HealthMetrics
└── HealthTrend

Relationship Components
├── RelationshipCard
├── RelationshipList
├── TouchpointLog
└── RelationshipGraph

Navigation
├── Breadcrumb
├── Tabs
├── TabBar
├── Stepper
├── Pagination
└── CommandPalette (Cmd+K)

Feedback
├── Toast
├── Alert
├── ConfirmDialog
├── Modal
├── Drawer
├── Sheet
├── Tooltip
├── Popover
└── ProgressIndicator

Inputs
├── Button (variants: primary, secondary, ghost, danger, icon)
├── Input
├── Textarea
├── Select
├── MultiSelect
├── DatePicker
├── TimePicker
├── DateTimePicker
├── Switch
├── Checkbox
├── Radio
├── Slider
├── Combobox
├── ColorPicker
├── TagInput
└── FileUpload

Charts & Data Viz
├── BarChart
├── LineChart
├── AreaChart
├── PieChart
├── RadarChart (domain balance)
├── HeatMap
├── ScatterPlot
└── Sparkline

Utility
├── Skeleton (loading)
├── EmptyState
├── ErrorState
├── OfflineIndicator
├── Badge
├── Avatar
├── AvatarGroup
├── Chip
├── Divider
├── Kbd (keyboard shortcut)
├── Spacer
└── LazyLoad
```

---

## 3. Core Components

### 3.1 Card

```typescript
interface CardProps {
  variant?: 'default' | 'ai' | 'highlighted' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  shadow?: boolean;
  hoverable?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}
```

**Variants:**
- **default** — Standard card with border + shadow (neobrutalism)
- **ai** — Dashed border, sparkle icon indicator (AI-generated content)
- **highlighted** — Accent left border (important item)
- **ghost** — No border/shadow (nested content)

### 3.2 AI Suggestion Card

```typescript
interface AISuggestionCardProps {
  title: string;
  description: string;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  actions: {
    primary: { label: string; onClick: () => void };
    secondary?: { label: string; onClick: () => void };
    dismiss?: boolean;
  };
  onFeedback?: (rating: number) => void;
}
```

### 3.3 TimeBlock (Schedule)

```typescript
interface TimeBlockProps {
  startTime: string;
  endTime: string;
  title: string;
  type: 'task' | 'habit' | 'routine' | 'break' | 'buffer'
    | 'meeting' | 'focus' | 'learning' | 'social' | 'health' | 'personal';
  energyLevel: 'low' | 'medium' | 'high';
  isFlexible: boolean;
  isAiSuggested: boolean;
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped';
  onDragEnd?: (newTime: Date) => void;
  onClick?: () => void;
  onComplete?: () => void;
  onDefer?: () => void;
}
```

### 3.4 Goal Tree

```typescript
interface GoalTreeProps {
  goals: GoalNode[];  // Recursive structure
  expandedIds: string[];
  onToggle: (goalId: string) => void;
  onSelect: (goalId: string) => void;
  onAddSubGoal: (parentId: string) => void;
  depth?: number; // Max expansion depth
}

interface GoalNode {
  id: string;
  title: string;
  level: GoalLevel;
  progress: number;
  status: GoalStatus;
  children: GoalNode[];
  taskCount: number;
  completedTaskCount: number;
}
```

### 3.5 AIChat

```typescript
interface AIChatProps {
  sessionId: string;
  initialMessage?: string;
  onSendMessage: (message: string) => Promise<void>;
  messages: ChatMessage[];
  isStreaming: boolean;
  contextChips?: ContextChip[]; // Quick context actions
  suggestedPrompts?: string[];  // Follow-up suggestions
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'streaming' | 'error';
  metadata?: {
    model?: string;
    tokens?: number;
    confidence?: number;
    actions?: ActionButton[];
  };
}
```

---

## 4. Component States

Every interactive component supports these states:

| State | Implementation |
|---|---|
| **Default** | Normal appearance |
| **Hover** | Background color shift, slight scale (1.02) |
| **Active** | Shadow inset, slight scale (0.98) |
| **Focus** | Focus ring (2px offset, accent color) |
| **Disabled** | Reduced opacity (50%), no interaction |
| **Loading** | Skeleton or spinner |
| **Error** | Error styling with message |
| **Empty** | Empty state with guidance |
| **AI-generated** | Dashed border + indicator |

---

## 5. Composition Patterns

### 5.1 Page Template

```typescript
// Each page follows this structure
interface PageTemplateProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;   // Page-level actions
  aiInsight?: string;          // AI context for this page
  sidebar?: React.ReactNode;   // Optional sidebar content
  children: React.ReactNode;   // Main content
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  emptyState?: React.ReactNode;
}
```

### 5.2 Split View

```typescript
interface SplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultRatio?: number; // 0.5 = 50/50
  minLeft?: number;       // px
  minRight?: number;      // px
  resizable?: boolean;
}
```

---

## 6. Implementation Rules

1. **All components in `src/components/ui/`** — based on shadcn/ui
2. **Domain components in `src/components/domain/`** — goal/, task/, plan/, etc.
3. **Compose, don't inherit** — prefer composition over complex component inheritance
4. **Props over variants** — avoid prop explosion; use composition for complex variations
5. **Server components first** — static content rendered server-side where possible
6. **Client components marked** — `'use client'` directive at the top of any file using React hooks, event handlers, or browser APIs (e.g., `useState`, `useEffect`, `onClick`, `useRouter`)
7. **Accessibility built-in** — all interactive elements have proper ARIA attributes

---

## 7. Related Documents

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — Design tokens and styling
- [UI_SYSTEM.md](./UI_SYSTEM.md) — UI architecture and pages
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Frontend component architecture
