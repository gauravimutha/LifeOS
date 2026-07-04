# UI System

## 1. Overview

The LifeOS UI is designed for clarity, speed, and minimal cognitive load. Every UI decision answers: *"Does this genuinely reduce cognitive load and help the user make better life decisions?"*

The UI follows Modern Neobrutalism — bold, clean, accessible, and professional.

**Note (Next.js App Router):** All components are Server Components by default. Interactive components (forms, buttons, AI chat, drag-and-drop) use the `'use client'` directive. This reduces client-side JavaScript and improves performance. Server Components handle static content, data fetching, and layout; Client Components handle interactivity and browser APIs.

---

## 2. Layout Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Top Bar (Global)                                          │
│  [Logo] [Search] [Notifications] [AI Avatar] [User Menu]   │
├────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌────────────────────────────────────────┐  │
│  │  Sidebar │ │  Main Content Area                      │  │
│  │  (Nav)   │ │                                         │  │
│  │          │ │  ┌──────────────────────────────────┐   │  │
│  │  Home    │ │  │  Content Header                  │   │  │
│  │  Plan    │ │  │  [Title] [Actions] [View Toggle] │   │  │
│  │  Goals   │ │  └──────────────────────────────────┘   │  │
│  │  Tasks   │ │                                         │  │
│  │  Habits  │ │  ┌──────────────────────────────────┐   │  │
│  │  Journal │ │  │  Content Body                     │   │  │
│  │  Health  │ │  │                                   │   │  │
│  │  AI Chat │ │  │  (Main feature content)           │   │  │
│  │          │ │  │                                   │   │  │
│  │  ────────│ │  └──────────────────────────────────┘   │  │
│  │  Settings│ │                                         │  │
│  └──────────┘ └────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────┤
│  Bottom Bar (Mobile)                                       │
│  [Home] [Plan] [Tasks] [AI Chat] [More]                   │
└────────────────────────────────────────────────────────────┘
```

---

## 3. View Hierarchy

### 3.1 Core Views

| View | Route | Primary Purpose |
|---|---|---|
| **Home / Dashboard** | `/` | Daily overview: plan, priorities, AI briefing |
| **Plan** | `/plan` | Full plan view (daily/weekly/monthly) |
| **Goals** | `/goals` | Goal hierarchy and progress |
| **Tasks** | `/tasks` | All tasks (by context, priority, goal) |
| **Habits** | `/habits` | Habit tracking and streaks |
| **Routines** | `/routines` | Routine management |
| **Calendar** | `/calendar` | Calendar visualization |
| **Journal** | `/journal` | Journal entries and reflections |
| **Health** | `/health` | Health metrics and trends |
| **Relationships** | `/relationships` | Relationship management |
| **AI Chat** | `/ai` | AI conversation interface |
| **Analytics** | `/analytics` | Life stats and insights |
| **Settings** | `/settings` | User and app settings |

### 3.2 Modal / Side Panel Views

| View | Trigger | Purpose |
|---|---|---|
| **Quick Add** | `Cmd+K` | Quick entity creation |
| **Entity Detail** | Click on entity | Deep view of any entity |
| **AI Briefing** | Morning auto-open | Daily AI briefing |
| **Plan Proposal** | After reschedule | Review plan changes |
| **Decision Help** | AI suggestion | Trade-off analysis view |
| **Notifications** | Bell icon | Activity feed |

---

## 4. Interaction Patterns

### 4.1 Minimal Friction

| Pattern | Example |
|---|---|
| **Swipe to confirm** | Swipe right to approve task |
| **Tap to defer** | Single tap to move task to tomorrow |
| **Drag to reschedule** | Drag task to new time slot |
| **Long press for options** | Long press for context menu |
| **Auto-save** | All changes saved instantly |
| **Undo** | Toast notification with undo option |

### 4.2 AI Interaction Patterns

| Pattern | Description |
|---|---|
| **AI Suggestion Card** | Non-intrusive card with AI recommendation |
| **Quick confirm/reject** | Thumbs up/down on AI suggestions |
| **Explain this** | Tap to get AI reasoning for any suggestion |
| **Modify request** | "Actually, move this to afternoon" |
| **Feedback widget** | Inline rating after AI interaction |

### 4.3 Ghost Interface

Clean, minimal UI that reveals complexity only when needed:

```
Default view:                            With interaction:
┌────────────────────┐                  ┌────────────────────┐
│ Today's Focus      │                  │ Today's Focus      │
│                    │                  │                    │
│ ○ Task 1          │                  │ ○ Task 1          │
│ ○ Task 2          │                  │ ○ Task 2    [>][x] │
│ ○ Task 3          │                  │ ○ Task 3          │
│ ○ (+3 more)       │                  │ ○ Task 4          │
└────────────────────┘                  │ ○ Task 5          │
                                        │ ○ Task 6          │
                                        └────────────────────┘
```

---

## 5. Responsive Breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| **Mobile** | < 640px | Single column, bottom nav |
| **Tablet** | 640-1024px | Two column, sidebar collapsible |
| **Desktop** | 1024-1440px | Full sidebar, content + optional panel |
| **Wide** | > 1440px | Multi-column, full dashboard |

---

## 6. Key Screens

### 6.1 Home Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ ☀ Good morning, Alex!                    [AI Briefing]  │
│─────────────────────────────────────────────────────────│
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│ │ Today's Focus│ │ Goal Progress│ │ Energy Today │    │
│ │ 3 tasks      │ │ Health: 70%  │ │ ████░░░░ 60% │    │
│ │ 1 habit left │ │ Career: 45%  │ │ Mood: Good   │    │
│ └──────────────┘ └──────────────┘ └──────────────┘    │
│─────────────────────────────────────────────────────────│
│ AI Insight: "You're most productive between 9-11 AM.   │
│ I've scheduled your deep work then."                    │
│─────────────────────────────────────────────────────────│
│ Timeline View (compact)                                 │
│ 09:00 ████████ Deep Work: Project X                     │
│ 10:30 ░░░░░░░░ Break                                    │
│ 11:00 ████████ Admin: Email + Planning                  │
│ ...                                                      │
└─────────────────────────────────────────────────────────┘
```

### 6.2 AI Chat

```
┌─────────────────────────────────────────────────────────┐
│  AI Chat                                      [New Chat] │
│─────────────────────────────────────────────────────────│
│ ┌────────────────────────────────────────────────────┐  │
│ │ AI: Good morning! I've reviewed your schedule.     │  │
│ │    You had 6.5h sleep last night. Want to adjust   │  │
│ │    today's plan, or keep it as is?                 │  │
│ └────────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────────┐  │
│ │ You: Let's keep it. But can you add a 30min walk   │  │
│ │      after lunch?                                  │  │
│ └────────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────────┐  │
│ │ AI: Done! I've added a walk from 1-1:30 PM.       │  │
│ │    The afternoon focus block shifted to 2 PM.     │  │
│ │    [View Updated Plan]                             │  │
│ │    Anything else?                                  │  │
│ └────────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────────┐  │
│ │ You: How's my goal progress this week?             │  │
│ └────────────────────────────────────────────────────┘  │
│─────────────────────────────────────────────────────────│
│ [Type a message...]                          [Send]    │
└─────────────────────────────────────────────────────────┘
```

### 6.3 Goal Tree View

```
┌─────────────────────────────────────────────────────────┐
│ Goals                                          [+ Add]  │
│─────────────────────────────────────────────────────────│
│ 🌟 Vision: Live a balanced, purposeful life             │
│ │                                                        │
│ ├─ 🎯 Long-term: Build financial freedom (3yr)          │
│ │  │ [████████░░░░░░ 65%]                               │
│ │  │                                                      │
│ │  ├─ 📅 Yearly: Increase income by 30%                 │
│ │  │  │ [██████░░░░░░░░ 50%]  Due: Dec 2026             │
│ │  │  │                                                      │
│ │  │  ├─ 📅 Q1: Launch side project                     │
│ │  │  │  │ [████████████ 100%] ✅ Complete               │
│ │  │  │  │                                                      │
│ │  │  ├─ 📅 Q2: Grow to $2K MRR                    │
│ │  │  │  │ [████████░░░░ 70%]  Due: Jun 30             │
│ │  │  │  │  ├─ 📅 Jun: Reach 50 customers               │
│ │  │  │  │  │  └─ ☐ Task: Email 10 leads               │
│ │  │  │  │  │  └─ ☐ Task: Update pricing page          │
```

---

## 7. Loading States

| State | Display |
|---|---|
| **Initial load** | Skeleton screens matching layout |
| **AI generating** | Streaming response with character-by-character display |
| **Saving** | Non-blocking auto-save indicator |
| **Sync** | Subtle sync icon when connecting |
| **Error** | Inline error with retry option |
| **Offline** | Offline indicator + cached data display |

---

## 8. Accessibility Requirements

| Requirement | Standard |
|---|---|
| Color contrast | WCAG AA minimum (AAA preferred) |
| Keyboard navigation | Full keyboard operability |
| Screen reader | ARIA labels on all interactive elements |
| Focus indicators | Visible focus rings |
| Motion sensitivity | Respect `prefers-reduced-motion` |
| Font scaling | Support up to 200% zoom |
| Touch targets | Minimum 44x44px |

---

## 9. Performance Targets

| Metric | Target |
|---|---|
| First paint | < 1s |
| Time to interactive | < 2s |
| AI response display | < 500ms (streaming start) |
| Navigation | < 100ms |
| Search | < 200ms |
| Plan load | < 500ms |
| Animation frame rate | 60fps |

---

## 10. Related Documents

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — Design tokens and visual language
- [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) — Component catalog
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Frontend architecture
- [API_SPEC.md](./API_SPEC.md) — API endpoints for UI
