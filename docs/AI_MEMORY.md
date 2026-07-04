# AI Memory System

## 1. Overview

The AI Memory system enables LifeOS to remember facts, preferences, patterns, and context about each user across sessions. It is the foundation of the AI's ability to provide personalized, context-aware guidance.

Memory is not a simple chat log. It is a structured knowledge base that the AI queries, updates, and synthesizes continuously.

---

## 2. Memory Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    AI Memory System                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  Short-Term  │  │  Long-Term   │  │  Working Context │ │
│  │  (Session)   │  │  (Persistent)│  │  (Active Now)    │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
│         │                 │                    │            │
│         ▼                 ▼                    ▼            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                Memory Store                           │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────────────┐   │  │
│  │  │ Relational│ │  Vector  │ │  Semantic Index    │   │  │
│  │  │ (Facts)  │ │(Embeddings)│  (Memory retrieval)  │   │  │
│  │  └──────────┘ └──────────┘ └────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Memory Operations                                     │  │
│  │  Write · Read · Search · Forget · Consolidate · Archive│  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Memory Types

### 3.1 Memory Taxonomy

| Type | Description | TTL | Example |
|---|---|---|---|
| **fact** | Concrete, verifiable information about the user | Long-term | "User has 2 children" |
| **preference** | User's stated or inferred preferences | Long-term | "User prefers morning workouts" |
| **pattern** | Recurring behavior or trend | Medium-term | "User tends to procrastinate admin tasks" |
| **context** | Current state or situation | Short-term | "User is preparing for a presentation this week" |
| **decision** | Past decisions with rationale | Long-term | "User chose to pause side project for health reasons" |
| **feedback** | User's reaction to AI suggestions | Medium-term | "User found data-driven planning helpful" |
| **insight** | AI-generated synthesis from multiple data points | Long-term | "User works best on creative tasks in the morning" |
| **learning** | New skill, knowledge, or understanding | Long-term | "User completed a React course" |

### 3.2 Memory Lifecycle

```
Creation
   │
   ▼
Validation (confidence scoring)
   │
   ├── High confidence (> 0.7) → Store in long-term
   ├── Medium confidence (0.4-0.7) → Tag for verification
   └── Low confidence (< 0.4) → Store in short-term pending confirmation
   │
   ▼
Reinforcement (each confirmation increases confidence)
   │
   ▼
Decay (confidence decreases without reinforcement)
   │
   ├── Below threshold → Archive
   └── Contradicted → Resolve conflict / Archive
```

---

## 4. Memory Storage

### 4.1 Relational Memory (Structured Facts)

Stored in `ai_memory` table (see [DATABASE.md](./DATABASE.md) for schema).

```typescript
interface AIMemory {
  id: string;
  userId: string;
  memoryType: 'fact' | 'preference' | 'pattern' | 'context'
    | 'decision' | 'feedback' | 'insight' | 'learning';
  key: string;       // Semantic key for programmatic lookup
  value: any;         // JSON value
  confidence: number; // 0.0 to 1.0
  isActive: boolean;  // Whether this memory is currently relevant
  expiresAt?: Date;   // When to auto-archive (short-term context)
  source?: string;    // How this memory was created (chat, journal, analysis, import)
  createdAt: Date;
  updatedAt: Date;
}
```

**Memory key namespacing:**
```
user.preferences.communication_style → "concise"
user.preferences.planning_time → "evening"
user.facts.job_title → "Software Engineer"
user.patterns.morning_energy → "low_before_coffee"
user.context.current_focus → "Q4 product launch"
```

### 4.2 Vector Memory (Embeddings)

For semantic search, memories are embedded and stored in `ai_embeddings` table with pgvector.

**What gets embedded:**
- Journal entries
- AI chat messages
- Task descriptions
- Goal descriptions
- AI memories (factual content)
- User notes and reflections

**Embedding pipeline:**
```
Content → Chunk (if long) → Embed (OpenAI/text-embedding-3-small) → Store with metadata → Index
```

**Retrieval:**
```
User query → Embed → Vector similarity search → Top-K results → Filter by relevance → Return to context
```

---

## 5. Memory Operations

### 5.1 Writing Memory

**Explicit write:**
```typescript
await memoryService.write({
  userId: user.id,
  type: 'fact',
  key: 'user.facts.significant_other_name',
  value: 'Sarah',
  confidence: 1.0,
  source: 'user_stated',
});
```

**Implicit extraction (AI-triggered):**
After conversation, journal, or data change, the AI scans for extractable memories:

```typescript
interface MemoryExtractionRule {
  trigger: 'conversation' | 'journal' | 'planning' | 'check_in';
  extractFrom: string; // Context data
  patterns: RegExp[];  // Pattern matching
  schema: ZodSchema;   // Expected memory structure
}
```

**Extraction examples:**
- User says "I'm really stressed about work" → Memory: `context.current_stress` = "work"
- User journal "Woke up at 5am, felt great" → Memory: `pattern.early_start_benefit` = "positive"
- User skips habit 3 times → Memory: `pattern.habit_resistance` (habit_id, reason inferred)

### 5.2 Reading Memory

**Direct lookup:**
```typescript
const memory = await memoryService.read(userId, 'user.facts.job_title');
```

**Pattern match:**
```typescript
const memories = await memoryService.search(userId, 'preference.*planning*');
```

### 5.3 Semantic Search

```typescript
const relevantMemories = await memoryService.semanticSearch({
  userId: user.id,
  query: "What does user think about morning routines?",
  limit: 5,
  minConfidence: 0.5,
});
```

### 5.4 Memory Consolidation

**Weekly consolidation process:**
1. Scan all short-term memories created in the past week
2. Identify related memories (same key, similar embeddings)
3. Merge: combine values, average confidence
4. Promote high-confidence patterns to long-term
5. Archive unresolved low-confidence memories

**Monthly synthesis:**
1. Analyze all memories created this month
2. Generate insights (e.g., "User consistently works best between 9-11 AM")
3. Store insights as new memories with high confidence
4. Update user model with synthesized patterns

### 5.5 Forgetting

**Automatic triggers:**
- Short-term context expires based on TTL
- Contradiction detected (new memory conflicts with old)
- User explicitly deletes
- Confidence drops below 0.1 (lack of reinforcement)
- Entity deleted (cascade delete related memories)

**Conflict resolution:**
```
Old memory: "user prefers morning workouts" (confidence: 0.8, age: 6 months)
New data: User consistently works out at 6 PM for 3 weeks

Resolution:
- Reduce old memory confidence to 0.5
- Create new memory: "user currently works out at 6 PM" (confidence: 0.6)
- Flag for user verification
```

---

## 6. Memory in Context

### 6.1 Context Assembly

When the AI needs to respond, it assembles relevant memories into working context:

```typescript
async function buildAIContext(userId: string, taskType: string): Promise<AIContext> {
  return {
    // Always include
    identity: await memoryService.readByPrefix(userId, 'user.facts.*'),
    preferences: await memoryService.readByPrefix(userId, 'user.preferences.*'),

    // Task-specific
    relevantMemories: await memoryService.semanticSearch({
      userId,
      query: taskType,
      limit: 10,
    }),

    // Recent context
    currentContext: await memoryService.readByPrefix(userId, 'user.context.*'),

    // Patterns
    patterns: await memoryService.readByPrefix(userId, 'user.patterns.*',
      { minConfidence: 0.6 }),
  };
}
```

### 6.2 Token Budget Allocation

| Memory Type | Max Tokens | Priority |
|---|---|---|
| Identity & Facts | 500 | Highest |
| Active Preferences | 300 | High |
| Current Context | 200 | High |
| Top-5 Semantic Memories | 1000 | Medium |
| Recent Patterns | 300 | Medium |
| Historical (summarized) | 200 | Low |

---

## 7. Privacy & Security

### 7.1 Memory Access

| Access Level | Scope | Examples |
|---|---|---|
| **Personal** | User's own memories | All user memory |
| **AI Only** | Used for context but never exposed | Inferred patterns, embeddings |
| **System** | Anonymized aggregate patterns | Cross-user learnings (no PII) |

### 7.2 User Controls

Users can:
1. **View all stored memories** — See what the AI knows about them
2. **Edit any memory** — Correct inaccuracies
3. **Delete any memory** — Remove what they don't want stored
4. **Export all memories** — Data portability
5. **Pause memory writing** — Stop new memory creation (read-only mode)
6. **Clear all memories** — Full reset
7. **Set memory sensitivity** — Certain topics require confirmation before storing

### 7.3 Retention Policies

| Memory Type | Default Retention | Maximum |
|---|---|---|
| Facts | Indefinite | Indefinite |
| Preferences | 2 years | Indefinite |
| Patterns | 1 year | 2 years |
| Context | 30 days | 90 days |
| Decisions | 2 years | Indefinite |
| Feedback | 1 year | 2 years |
| Insights | Indefinite | Indefinite |
| Learning | 5 years | Indefinite |

---

## 8. Performance Targets

| Metric | Target |
|---|---|
| Memory write latency | < 50ms |
| Memory read (direct) | < 10ms |
| Semantic search (top-5) | < 200ms |
| Context assembly | < 500ms |
| Weekly consolidation | < 30s per user |
| Storage per user | < 10MB (text only, excluding embeddings) |

---

## 9. Related Documents

- [AI_ENGINE.md](./AI_ENGINE.md) — How memory integrates with AI operations
- [AI_PERSONALITY.md](./AI_PERSONALITY.md) — How personality influences memory priority
- [DATABASE.md](./DATABASE.md) — Memory table schemas
- [LIFE_GRAPH.md](./LIFE_GRAPH.md) — How memory nodes connect to the Life Graph
