# Analytics & Insights

## 1. Overview

The Analytics system provides users with meaningful insights about their life patterns, progress, and balance — without overwhelming them with data. Every metric serves the goal of helping users make better decisions.

---

## 2. Life Scores

### 2.1 Overall Life Score

A composite score (0-100) reflecting overall life quality:

```typescript
interface LifeScore {
  overall: number;          // 0-100
  domainScores: DomainScore[];
  trend: 'improving' | 'declining' | 'stable';
  change: number;           // +/- from last period
  factors: ScoreFactor[];   // What contributed most to the score
}

interface DomainScore {
  domain: LifeDomain;
  score: number;            // 0-100
  weight: number;           // User-configurable importance
  trend: 'improving' | 'declining' | 'stable';
  lastPeriod: number;       // Previous score for comparison
  goalAlignment: number;    // How well current state aligns with goals
}

interface ScoreFactor {
  factor: string;           // e.g., "sleep_quality", "task_completion"
  impact: 'positive' | 'negative';
  magnitude: number;        // How much this affected the score
}
```

### 2.2 Domain Scores

| Domain | Weight (Default) | Metrics |
|---|---|---|
| Health & Fitness | 15% | Sleep quality, exercise frequency, energy, mood |
| Mental & Emotional | 15% | Stress level, journal sentiment, meditation consistency |
| Relationships | 15% | Social touchpoints, quality time, gratitude |
| Career & Work | 15% | Goal progress, task completion, satisfaction |
| Learning & Growth | 10% | Learning hours, skill acquisition, reading |
| Finance | 10% | Budget adherence, savings progress, debt reduction |
| Creativity & Passion | 10% | Creative hours, project progress, flow state |
| Home & Environment | 5% | Organization, cleanliness, maintenance |
| Spirituality & Meaning | 5% | Reflection frequency, values alignment |

---

## 3. Dashboards

### 3.1 Daily Dashboard

```
Today's Stats:
- Tasks: 4/6 completed (67%)
- Habits: 2/3 done (67%)
- Energy: ████░░░░ 6/10
- Mood: ████████ 8/10
- Focus hours: 3.5h
- AI suggestions accepted: 2/2
```

### 3.2 Weekly Dashboard

```
This Week vs Last Week:
- Task completion: 78% ↑ (+5%)
- Goal progress: +12% ↑ (+3%)
- Habit adherence: 71% ↓ (-4%)
- Average energy: 6.8 ↑ (+0.5)
- Average mood: 7.2 ↑ (+0.3)
- Focus hours: 21h ↑ (+2h)
- Social touchpoints: 4 ↓ (-2)
- Exercise sessions: 3 ↑ (+1)
```

### 3.3 Monthly Dashboard

```
Monthly Highlights:
- Most productive day: Tuesdays (avg 85% completion)
- Best energy time: 9-11 AM
- Most consistent habit: Morning meditation (28/30 days)
- Biggest challenge: Afternoon slumps (3-4 PM)
- Top insight: "Your goal progress doubles when you exercise in the morning"
```

### 3.4 Quarterly Dashboard

```
Q2 2026 Review:
- Goals completed: 3/5 (60%)
- Goals on track: 2/5 (40%)
- Life Score: 72 ↑ (+5 from Q1)
- Domain balance: ⚠️ Health declining, Career improving
- Key achievements: [list]
- Areas for next quarter: [list]
- AI recommendation: "Focus on health next quarter to restore balance"
```

---

## 4. Visualizations

| Chart Type | Usage |
|---|---|
| **Radar chart** | Domain balance (current vs. target) |
| **Line chart** | Trends over time (energy, mood, productivity) |
| **Bar chart** | Weekly/monthly comparisons |
| **Heatmap** | Habit calendar, productivity by time of day |
| **Area chart** | Cumulative goal progress |
| **Scatter plot** | Energy vs. productivity correlation |
| **Network graph** | Life Graph visualization |
| **Gauge meter** | Life Score display |

---

## 5. AI-Generated Insights

The AI generates insights by analyzing patterns across data sources:

### 5.1 Pattern Detection

```typescript
interface Insight {
  id: string;
  type: 'pattern' | 'correlation' | 'anomaly' | 'recommendation' | 'celebration';
  title: string;
  description: string;
  confidence: number;
  supportingData: {
    metric: string;
    value: number;
    comparison: number; // Compared to baseline
    period: string;
  }[];
  relatedEntities: string[]; // Entity IDs
  actionable: boolean;
  actionLabel?: string;
}
```

**Example insights:**

| Type | Example |
|---|---|
| **Pattern** | "You consistently complete creative tasks in the morning" |
| **Correlation** | "When you sleep >7h, your task completion increases by 23%" |
| **Anomaly** | "Your energy dropped significantly after Tuesday's late meeting" |
| **Recommendation** | "Consider scheduling deep work before 2 PM based on your energy patterns" |
| **Celebration** | "You've exercised 5 days this week — your best streak this year!" |

### 5.2 Burnout Detection

The AI monitors burnout indicators continuously:

| Indicator | Warning Level | Action |
|---|---|---|
| **Task completion dropping** | Yellow | Reduce task count; suggest easier week |
| **Energy consistently low** | Yellow | Prioritize recovery; check sleep/exercise |
| **Mood declining >3 days** | Orange | Increase social/self-care suggestions |
| **Sleep <6h for 5+ days** | Orange | Recommend sleep hygiene routine |
| **Work hours >10h/day for 5+ days** | Orange | Suggest boundary setting |
| **Multiple indicators** | Red | Trigger recovery mode; pause non-essential goals |
| **Self-reported feeling burned out** | Red | Immediate plan adjustment; self-care focus |

---

## 6. Export & Reports

| Format | Contents | Frequency |
|---|---|---|
| **PDF Weekly Report** | Summary, scores, insights | Weekly |
| **PDF Monthly Report** | Detailed analytics, trend analysis | Monthly |
| **PDF Quarterly Review** | Goal progress, life score trends | Quarterly |
| **CSV Export** | Raw data for all domains | On demand |
| **JSON Export** | Full data export (portability) | On demand |

---

## 7. Privacy

- All analytics data is computed from user's own data
- No cross-user comparison without explicit consent (future opt-in)
- Aggregate anonymous benchmarks (future, opt-in)
- Users can clear analytics history independently of core data

---

## 8. Related Documents

- [LIFE_GRAPH.md](./LIFE_GRAPH.md) — Graph data used in analytics
- [AI_ENGINE.md](./AI_ENGINE.md) — AI insight generation
- [GOAL_SYSTEM.md](./GOAL_SYSTEM.md) — Goal progress tracking
- [DATABASE.md](./DATABASE.md) — Analytics events table
