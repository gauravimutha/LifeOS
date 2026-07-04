# Development Roadmap

## 1. Overview

This roadmap defines the phased development of LifeOS from initial foundation to full personal platform. Each phase builds on the previous, with clear milestones and deliverables.

---

## 2. Phase 0: Foundation (Current)

**Duration:** 4-6 weeks
**Status:** In progress

### Deliverables

- [x] Documentation complete (all /docs)
- [x] Project scaffolding (Next.js + TypeScript + Tailwind)
- [x] Design system implementation (shadcn/ui setup, design tokens)
- [x] Zustand stores setup (Auth, Goals, Tasks, Habits, etc.)
- [x] Database migration (Single-user Prisma schema generated and validated)
- [x] Refactored core services & API routes to enforce absolute account isolation

---

## 3. Phase 1: Goals Hierarchy & Core System (Completed)

**Duration:** 4 weeks
**Target:** Local deployment testing

### Features

- **Goal Levels:** Supported levels (vision, long-term, yearly, quarterly, monthly, weekly)
- **Goal Forms & Cards:** Unified GoalForm, Level-based GoalCards, status transitions
- **Sub-goal decomposition:** Dynamic hierarchy validation
- **Goal-to-Task Traceability:** Mandatory trace parent linking

### Milestones

- **M1:** All goals, habits, and tasks isolated to the authenticated user.
- **M2:** Hierarchical goal creation and child goal decomposition operational.

---

## 4. Phase 2: Routine & Life Modes (Completed)

**Duration:** 3 weeks
**Target:** Private developer preview

### Features

- **Routine Block Types:** Morning, Afternoon, Evening, Night routines, customized flexible steps
- **Weekly Routine Editor:** Interactive step-ordering and duration allocations
- **10 Life Modes:** Dynamic context switching (Focus, Creative, Social, Health, Travel, Family, Rest, Administrative, Learning, Routine)
- **Status indicators:** Visibility on current mode and energy impact

### Milestones

- **M3:** Interactive routine scheduler operational.
- **M4:** Active life mode affects task prioritization.

---

## 5. Phase 3: AI Coach Evolution (Completed)

**Duration:** 3-4 weeks
**Status:** Completed

### Features

- **Daily Check-In:** Step-by-step questionnaire flow (mood, energy, sleep, habits)
- **5 Coach Personalities:** Motivational, Strategist, Empathetic, Direct, and Academic (Socratic)
- **Socratic Accountability Engine:** Deferral tracking (`deferCount`) prompting task simplification or adaptive scheduling adjustments.
- **Contextual Dialogue:** Conversational advisor querying memories, active goals, and preferences in `src/app/api/ai/chat/route.ts`.

### Milestones

- [x] Daily check-in answers stored and correlated in graph database
- [x] Swappable AI coach personality styles
- [x] Socratic accountability prompting task breakdown actions

---

## 6. Phase 4: Reviews & Insights (Completed)

**Duration:** 3 weeks
**Status:** Completed

### Features

- **Period Review Types:** Daily reflection, Weekly performance letter, and Monthly/Quarterly reviews
- **AI Weekly briefing letter**: Personal briefing letter covering wins, challenges, and next-week pacing
- **Insights & Predictions**: Predictive readiness gauges (e.g. Placement readiness, Fitness consistency) based on historical performance velocity.
- **Future Self Vision**: Inline editor storing user's long-term ideals in memory key-value paths.

### Milestones

- [x] Evening Reflection check-in card operational
- [x] Chief of Staff Weekly Intelligence Letter fully integrated
- [x] Outcome progress predictions and 5-Year Vision statement persistent

---

## 7. Phase 5: Product Design Update & Advanced AI

**Duration:** 4-6 weeks
**Target:** GA / v1.0

### Features

- **AI Goal Wizard:** Structured conversational wizard to decompose big goals
- **GoalCard Expanded View:** Deep dependencies, linked tasks, and parent progress
- **Smart Calendar Sync:** Bidirectional Google/Apple calendar integration
- **Burnout Detection:** Alerts based on consecutive low sleep/energy logs

### Milestones

- **M9:** Natural language goal creation works flawlessly.
- **M10:** Burnout prevention suggestions successfully surface in chat.

---

## 8. Current Focus

We have completed Phase 1 (Goals Hierarchy) and Phase 2 (Routines & Life Modes), including database cleanup, type removal, service refactoring, API route scoping, the interactive AI Daily Planner optimization, and the AI Goal Wizard. We are now advancing Phase 3 (AI Coach & Memory Integration).

---

## 9. Related Documents

- [PRD.md](./PRD.md) — Detailed feature requirements
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Technical architecture
- [CHANGELOG.md](./CHANGELOG.md) — Version history
