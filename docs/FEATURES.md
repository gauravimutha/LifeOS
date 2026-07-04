# Features

## Complete Feature List

### Dashboard (`/`)
- Greeting with time-based message
- 4 stat cards: Due Today, Overdue, Completed Today, Active Goals
- TodayPreview showing tasks due today
- Progress ring with completion rate
- Morning check-in CTA (if not done today)
- Evening review CTA (if tasks completed today)

### Task Management
- **Create** tasks with title, description, priority, category, deadline, estimated duration, linked goal
- **Filter** by today, upcoming, completed, all
- **Sort** by priority, deadline, creation date
- **Bulk actions** on task cards
- **Goal linking** via dropdown in task form

### Goals (`/goals`)
- **6-level hierarchy:** Vision → Long-Term → Yearly → Quarterly → Monthly → Weekly
- **AI-powered creation wizard:** Enter title, AI generates complete plan
- **Review & edit** AI suggestions before saving
- **Inline editing** and deletion
- **Add sub-goals** from any goal card
- **Expand/collapse** to show milestones, roadmap, skills, metrics
- **Recursive tree rendering** with visual nesting
- **Goal counts** (total, active, completed)

### Schedule & Modes (`/routine`)
- **Weekly time blocks** with day, time, label, category
- **Protected blocks** that AI avoids scheduling tasks in
- **10 life modes** with visual selector grid
- **Day-by-day grid view** of scheduled blocks

### AI Coach
- **Context-aware suggestions** based on tasks, goals, routine, check-ins
- **5 coach personalities:** Motivational, Direct, Gentle, Philosophical, Strategic
- **Manual overrides:** Available hours and energy level sliders
- **Check-in integration:** Mood, energy, sleep, focus, obstacles
- **Schedule awareness:** Avoids protected time blocks
- **Goal-aware reasoning:** References linked goals in recommendations

### Daily Check-in (`/checkin`)
- Mood (1-10), Energy (1-10), Sleep hours
- Focus for today
- Potential obstacles
- Gratitude
- Yesterday's accomplishments
- One-tap from dashboard or AI panel

### Reviews (`/reviews`)
- **4 tabs:** Daily, Weekly, Monthly, Insights
- **Daily reviews:** Productivity rating, completed/blocked entries
- **Weekly reviews:** AI-generated summaries with highlights, challenges, focus
- **Monthly reviews:** Same as weekly but monthly scope
- **Insights dashboard:** Current streak, longest streak, avg productivity, avg mood, goal progress, 7-day task completion chart

## Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Task CRUD | Complete | Full create/read/update/delete |
| Goal CRUD | Complete | With new AI-inferred fields |
| Goal AI Wizard | Complete | 3-step progressive disclosure |
| Weekly Routine | Complete | Add/delete blocks, protected toggle |
| Life Modes | Complete | 10 modes, selector UI |
| AI Suggestions | Complete | Context-aware task recommendation |
| Coach Personalities | Complete | 5 styles with system prompts |
| Daily Check-in | Complete | Full form with AI context |
| Period Reviews | Complete | AI-generated weekly/monthly |
| Insights Dashboard | Complete | Streaks, trends, 7-day chart |
| Goal Card Expand | Complete | Shows milestones, roadmap, skills |
| Responsive Design | Complete | Mobile drawer, bottom-sheets |
