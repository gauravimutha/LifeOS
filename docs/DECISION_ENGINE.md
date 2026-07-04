# Decision Engine

## 1. Overview

The Decision Engine is the AI's structured framework for making recommendations, analyzing trade-offs, and helping users make better decisions. It ensures that every AI recommendation is reasoned, transparent, and aligned with the user's values and goals.

---

## 2. Decision Framework

Every AI recommendation follows a structured process:

```
1. DEFINE THE DECISION
   └── What is the specific question or choice?
         │
         ▼
2. GATHER CONTEXT
   └── Relevant goals, constraints, history, Life Graph state
         │
         ▼
3. IDENTIFY OPTIONS
   └── Generate possible courses of action
         │
         ▼
4. EVALUATE OPTIONS
   └── Against: goals, values, resources, time, energy, impact
         │
         ▼
5. RECOMMEND
   └── With reasoning, confidence level, and alternatives
         │
         ▼
6. USER DECIDES
   └── User accepts, modifies, or rejects
         │
         ▼
7. LEARN
   └── Store decision + outcome + feedback in AI memory
```

---

## 3. Decision Types

### 3.1 Operational Decisions (Daily)

| Type | Example | AI Role |
|---|---|---|
| **Prioritization** | "Which task should I do first?" | Analyze urgency, importance, energy |
| **Scheduling** | "When should I do this?" | Calendar-aware time slot suggestion |
| **Deferral** | "Should I postpone this?" | Impact analysis of deferring |
| **Cancellation** | "Should I drop this?" | Consequence analysis |
| **Replacement** | "What should I do instead?" | Alternative generation |

### 3.2 Tactical Decisions (Weekly/Monthly)

| Type | Example | AI Role |
|---|---|---|
| **Goal adjustment** | "Should I change my goal?" | Progress analysis + recommendation |
| **Habit change** | "Should I modify this habit?" | Streak/data-driven analysis |
| **Resource allocation** | "Where should I focus this week?" | Cross-goal impact analysis |
| **Trade-off** | "Should I skip A to focus on B?" | Full Life Graph impact analysis |

### 3.3 Strategic Decisions (Quarterly/Yearly)

| Type | Example | AI Role |
|---|---|---|
| **Goal setting** | "What should my next goal be?" | Life vision alignment |
| **Life change** | "Should I change jobs?" | Full context + values analysis |
| **Major commitment** | "Should I take on this project?" | Capacity + opportunity cost analysis |
| **Values check** | "Am I living according to my values?" | Holistic life audit |

---

## 4. Evaluation Criteria

### 4.1 Universal Criteria

Every decision is evaluated against:

| Criterion | Weight | Description |
|---|---|---|
| **Goal alignment** | High | How does this serve the user's goals? |
| **Values alignment** | High | Does this match the user's stated values? |
| **Urgency** | Medium | What's the time sensitivity? |
| **Impact** | High | What's the potential positive/negative effect? |
| **Effort** | Medium | Required time, energy, resources |
| **Risk** | Medium | What could go wrong? |
| **Opportunity cost** | Medium | What is given up? |
| **Readiness** | Low | Is the user prepared/capable? |
| **Timing** | Medium | Is this the right time? |
| **Sustainability** | High | Does this support long-term balance? |

### 4.2 User-Specific Weights

Users can weight criteria differently. Weight profiles:

```typescript
interface DecisionWeightProfile {
  name: string; // 'balanced', 'ambitious', 'cautious', 'growth-focused'
  weights: {
    goalAlignment: number;  // 0.0 - 1.0
    valuesAlignment: number;
    urgency: number;
    impact: number;
    effort: number;
    risk: number;
    opportunityCost: number;
    timing: number;
    sustainability: number;
  };
}
```

**Default profiles:**
- **Balanced:** Even distribution across all criteria
- **Ambitious:** Higher weight on impact, lower on risk
- **Cautious:** Higher weight on risk, sustainability
- **Growth-focused:** Higher weight on learning, lower on effort

---

## 5. Trade-off Analysis

### 5.1 Pairwise Comparison

When a user faces a choice between two options:

```typescript
interface TradeOffAnalysis {
  optionA: string;
  optionB: string;
  comparisons: {
    criterion: string;
    aScore: number; // 1-10
    bScore: number; // 1-10
    weight: number;
    better: 'A' | 'B' | 'equal';
  }[];
  overallScore: { a: number; b: number };
  recommendation: string;
  confidence: number;
  explanation: string;
}
```

### 5.2 Multi-Option Decision Matrix

For 3+ options, the AI builds a decision matrix:

```
              │ Goal Align  │ Values │ Impact │ Effort │ Risk │ Total
──────────────┼─────────────┼────────┼────────┼────────┼──────┼──────
Option A      │ 9 (w:0.3)  │ 8(0.2) │ 7(0.2) │ 6(0.15)│ 7(0.15)│ 7.55
Option B      │ 6 (w:0.3)  │ 7(0.2) │ 8(0.2) │ 8(0.15)│ 5(0.15)│ 6.75
Option C      │ 8 (w:0.3)  │ 9(0.2) │ 6(0.2) │ 5(0.15)│ 8(0.15)│ 7.35
──────────────┴─────────────┴────────┴────────┴────────┴──────┴──────
Recommendation: Option A (balance of goal alignment and impact)
Alternative: Option C (if sustainability is priority)
```

---

## 6. Conflict Resolution

### 6.1 Goal Conflicts

When two goals compete for the same resources:

```typescript
interface GoalConflict {
  goalA: { id: string; title: string; priority: number };
  goalB: { id: string; title: string; priority: number };
  conflictType: 'time' | 'energy' | 'focus' | 'resource' | 'schedule';
  severity: number; // 1-10
  resolutionOptions: {
    type: 'repurpose' | 'reschedule' | 'reduce' | 'delegate' | 'remove';
    description: string;
    impact: string;
  }[];
  recommendedResolution: string;
}
```

### 6.2 Value Conflicts

When user's actions don't align with stated values:

```
Value: "Health is my top priority"
Reality: User hasn't exercised in 2 weeks, sleeping 5 hours/night

AI approach:
1. Observe without judgment
2. Ask exploratory questions
3. Offer support, not critique
4. Suggest small adjustments
5. Explore root cause
```

---

## 7. Recommendation Presentation

### 7.1 Standard Format

Every recommendation follows this structure:

```
┌─────────────────────────────────────────────────────────┐
│ RECOMMENDATION                                          │
│                                                         │
│ I recommend: [specific action]                          │
│                                                         │
│ Why: [brief explanation linking to goals/values]        │
│                                                         │
│ Confidence: [High/Medium/Low - with rationale]          │
│                                                         │
│ Trade-offs: [what this means giving up]                 │
│                                                         │
│ Alternative: [second-best option if this doesn't fit]   │
│                                                         │
│ What do you think?                                      │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Confidence Levels

| Level | Meaning | Display |
|---|---|---|
| **High (0.8-1.0)** | Strong data support, clear alignment | Green indicator |
| **Medium (0.5-0.8)** | Reasonable support, some uncertainty | Yellow indicator |
| **Low (0.2-0.5)** | Limited data, high uncertainty | Orange indicator |
| **Exploratory (< 0.2)** | Speculative, needs more data | Gray indicator |

---

## 8. Learning Loop

After every decision:

```typescript
interface DecisionOutcome {
  decisionId: string;
  userAction: 'accepted' | 'modified' | 'rejected';
  outcome: 'positive' | 'neutral' | 'negative' | 'unknown';
  userRating?: 1-5;
  userComment?: string;
  actualImpact?: string;
  timestamp: Date;
}
```

The Decision Engine uses outcomes to:
1. Adjust recommendation confidence for similar future decisions
2. Update user's decision weight profile
3. Identify patterns in user's decision-making style
4. Improve criteria importance based on actual results

---

## 9. Ethical Guardrails

The Decision Engine will not:
1. Make decisions that require professional licenses (medical, legal, financial)
2. Recommend actions that violate laws or ethical standards
3. Exploit cognitive biases to manipulate user choices
4. Make decisions on behalf of the user without explicit consent
5. Ignore mental health red flags (will suggest professional help)

---

## 10. Related Documents

- [AI_ENGINE.md](./AI_ENGINE.md) — Overall AI architecture
- [AI_PERSONALITY.md](./AI_PERSONALITY.md) — How personality informs recommendation style
- [AI_MEMORY.md](./AI_MEMORY.md) — Storing decision outcomes as memories
- [GOAL_SYSTEM.md](./GOAL_SYSTEM.md) — Goal alignment in decision evaluation
- [PLANNING_ENGINE.md](./PLANNING_ENGINE.md) — How decisions affect plans
