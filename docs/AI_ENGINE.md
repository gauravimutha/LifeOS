# AI Engine

## 1. Overview

The AI Engine is the brain of LifeOS. It orchestrates all AI interactions — from planning and scheduling to conversation and memory management. The engine is designed to be model-agnostic, using OpenRouter as the primary gateway with fallback support across multiple providers.

---
## 2. Architecture & AI Gateway

All AI interactions flow through a centralized **AI Gateway** layer (`src/services/ai/client.ts`). This serves as the single entrypoint for AI logic, executing the following pipeline:

```
[UI Request]
    │
    ▼
[Authentication Check]  (Confirms active session)
    │
    ▼
[Rate Limiter]          (Sliding-window checks, max 20 calls/min)
    │
    ▼
[Context Retriever]     (Dynamically fetches active goals and AI memories)
    │
    ▼
[Model Router]          (Selects tiny, medium, or large model)
    │
    ▼
[Response Cache]        (In-memory caching layer with 5-minute TTL)
    │
    ▼
[LLM Endpoint]          (OpenRouter completion call)
    │
    ▼
[Formatter & Auditing]  (Zod structure check, latencies & costs logged to DB)
    │
    ▼
[UI Update]
```

---

## 3. Engine Components

### 3.1 Context Collector

The Context Collector gathers all relevant information before each AI interaction.

**Data sources (gathered in order):**

| Source | What's Collected | Priority |
|---|---|---|
| **User identity** | Name, timezone, preferences, settings | Always |
| **Active goal chain** | Current vision → long-term → yearly → quarterly → monthly → weekly | Always |
| **Today's context** | Date, day of week, upcoming calendar events, weather (opt-in) | Always |
| **Task state** | Incomplete tasks today, overdue tasks, high-priority tasks | Always |
| **Health snapshot** | Sleep, energy, mood (last 24h), exercise | When available |
| **Habit status** | Today's habit completion, current streaks | When available |
| **Recent journal** | Last 3 journal entries (summarized) | When available |
| **AI Memory** | Active memories relevant to current context | Always |
| **Recent chat** | Last 10 AI chat messages | In conversation |
| **Life Graph subgraph** | Entities connected to current context | For planning/reasoning |
| **Burnout indicators** | Workload, stress, recovery balance | Weekly planning |

### 3.2 Prompt Builder

The Prompt Builder constructs structured prompts with:

1. **System prompt** — AI personality, behavioral guidelines, response format
2. **User context** — Aggregated context data (sized to fit model context window)
3. **Instruction** — What the AI should do (plan, suggest, analyze, chat)
4. **Output schema** — Zod schema defining expected structured response
5. **Few-shot examples** — Relevant examples from past successful interactions

**Prompt templating:**

```typescript
interface PromptTemplate {
  system: string;       // Base system prompt
  context: string;      // User context
  memory: string;       // Relevant AI memories
  instruction: string;  // What to do
  schema: ZodSchema;    // Expected output structure
  examples: Example[];  // Few-shot examples
}
```

### 3.3 Response Parser

All AI responses are **structured** and validated with Zod schemas.

```typescript
// Example: Daily plan response schema
const DailyPlanSchema = z.object({
  date: z.string(),
  summary: z.string(),
  priorities: z.array(z.object({
    taskId: z.string().optional(),
    title: z.string(),
    reason: z.string(),
    estimatedMinutes: z.number(),
  })),
  schedule: z.array(z.object({
    startTime: z.string(),
    endTime: z.string(),
    activity: z.string(),
    type: z.enum(['task', 'habit', 'break', 'focus', 'meeting', 'personal']),
    energyLevel: z.enum(['low', 'medium', 'high']).optional(),
  })),
  adjustments: z.array(z.object({
    type: z.enum(['reschedule', 'repurpose', 'defer', 'cancel']),
    taskId: z.string(),
    reason: z.string(),
  })),
  insights: z.array(z.string()),
});
```

**Parse flow:**
1. Raw AI response → JSON extraction (handle markdown-wrapped JSON)
2. Zod schema validation
3. Default value filling for missing optional fields
4. Error recovery (partial parse on validation failure)
5. Confidence scoring based on completeness

### 3.4 Model Router

The Model Router dynamically selects the optimal model size class for each request to balance reasoning depth, latency, and cost:

| Tier | Purpose | Model / Router Mapping | Fallback |
|---|---|---|---|
| **`tiny`** | Factual extraction, summaries, classifications, routine logging | `google/gemma-3-4b-it` | `meta-llama/llama-3-8b-instruct:free` |
| **`medium`** | Daily planning, task scheduling suggestions, reflection checks | `google/gemma-3-4b-it` | `openai/gpt-4o-mini` |
| **`large`** | Strategic coaching, Socratic chat, complex priority trade-offs | `anthropic/claude-3.5-sonnet` | `openai/gpt-4o` |

### 3.5 Token & Cost Optimizer

Our gateway implements several direct cost-control measures:
1. **Response Cache Layer**: Uses an in-memory key-value cache hashed by `userId + prompt + systemPrompt` with a **5-minute TTL**. Multiple duplicate requests during planning avoid hit costs.
2. **Dynamic Context Windows**: Truncates goals to a maximum of 5 active items and preferences/memories to a maximum of 8 active records. This enforces token limit safety and avoids bloated prompt requests.
3. **Structured Event-Driven Auditing**: Latency, estimated cost, and cached hits are tracked per-user via `AnalyticsEvent` triggers to monitor ongoing AI usage.

---

## 4. AI Operations

### 4.1 Planning Operations

| Operation | Trigger | Input | Output |
|---|---|---|---|
| `plan_day` | Daily morning trigger | Context + goals + tasks + calendar | Daily schedule |
| `plan_week` | Sunday evening | Weekly goals + progress + health | Weekly priorities |
| `plan_month` | Month start | Monthly goals + previous month review | Monthly focus areas |
| `reschedule` | Event change / health change | Changed context + current plan | Adjusted plan |
| `rebalance` | Burnout detection | Workload + health + stress + mood | Recovery recommendations |

### 4.2 Advisory Operations

| Operation | Trigger | Input | Output |
|---|---|---|---|
| `morning_briefing` | Morning | Today's plan + weather + calendar | Daily briefing |
| `evening_reflection` | Evening | Completed tasks + mood + energy | Reflection prompt |
| `goal_review` | Weekly | Goal progress + obstacles | Goal adjustment suggestions |
| `decision_support` | User query | Decision context + pros/cons + values | Recommendation |
| `habit_suggestion` | Pattern detection | Habit history + goals + health | New habit suggestion |

### 4.3 Conversational Operations

| Operation | Description |
|---|---|
| `chat` | Free-form AI conversation with full context |
| `coach` | Structured coaching conversation following a framework |
| `brainstorm` | Creative idea generation with structured output |
| `reflect` | Guided reflection with Socratic questioning |
| `analyze` | Deep analysis of a situation with multiple perspectives |

### 4.4 Memory Operations

| Operation | Trigger | Description |
|---|---|---|
| `extract_facts` | After significant interactions | Extract and store factual memories |
| `update_context` | State change | Update user context in memory |
| `archive_memory` | Expiry / obsolescence | Move outdated memories to long-term storage |
| `consolidate` | Weekly / monthly | Synthesize multiple memories into insights |

---

## 5. Event-Driven AI

The AI Engine subscribes to lifecycle events and triggers appropriate operations:

| Event | AI Response |
|---|---|
| `goal.created` | Analyze compatibility with existing goals; suggest sub-goals |
| `goal.completed` | Celebrate; suggest next goal; update Life Graph |
| `task.deferred` | Analyze pattern; suggest root cause resolution |
| `task.completed` | Update progress; check for dependent tasks |
| `health.logged` | Update energy/mood context; adjust plan if needed |
| `calendar.changed` | Trigger reschedule evaluation |
| `journal.written` | Extract insights; update AI memory |
| `habit.streak_broken` | Analyze cause; suggest recovery strategy |
| `burnout.detected` | Trigger recovery mode; rebalance priorities |
| `weekly.review` | Full weekly analysis + planning |

---

## 6. Quality Assurance

### 6.1 Response Quality Checks

| Check | Description | Threshold |
|---|---|---|
| **Schema adherence** | Response matches expected Zod schema | > 99% |
| **Relevance** | Response addresses user's query/context | Measured via user rating |
| **Consistency** | Response doesn't contradict known facts | Manual spot-check |
| **Safety** | No harmful, manipulative, or toxic content | Automated filter |
| **Cost efficiency** | Tokens used within budget | Per-model budgets |

### 6.2 Feedback Loop

Every AI response includes a feedback mechanism:

```typescript
interface AIFeedback {
  responseId: string;
  rating: 1 | 2 | 3 | 4 | 5; // 1 = unhelpful, 5 = excellent
  wouldChange?: string;    // What would improve it?
  appliedAction?: boolean;  // Did user follow the recommendation?
  context: string;          // What was happening?
}
```

Feedback is used to:
1. Fine-tune model selection (which model performs best for which task)
2. Adjust prompt templates (what phrasing gets better results)
3. Train custom models (future: fine-tuned open-source models)
4. Improve memory (what does the user prefer?)

---

## 7. Future AI Capabilities

| Capability | Phase | Description |
|---|---|---|
| **Local inference** | Phase 3 | On-device models for sensitive data processing |
| **Multi-agent** | Phase 3 | Specialized sub-agents (planner, coach, analyst) |
| **Fine-tuned models** | Phase 3 | LifeOS-specific fine-tuned open-source models |
| **Voice interface** | Phase 4 | Voice input/output for AI interactions |
| **Proactive notifications** | Phase 2 | AI-initiated check-ins and recommendations |
| **Emotion detection** | Phase 3 | Sentiment analysis from journal/journal context |
| **Life simulation** | Phase 5 | "What if" scenario modeling |

---

## 8. Related Documents

- [AI_PERSONALITY.md](./AI_PERSONALITY.md) — AI behavioral guidelines and personality
- [AI_MEMORY.md](./AI_MEMORY.md) — Memory system architecture
- [DECISION_ENGINE.md](./DECISION_ENGINE.md) — AI decision-making framework
- [PLANNING_ENGINE.md](./PLANNING_ENGINE.md) — Planning operations
- [TASK_ENGINE.md](./TASK_ENGINE.md) — Task generation and management
