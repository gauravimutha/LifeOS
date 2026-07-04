# System Architecture

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Next.js (App Router + TypeScript + Tailwind + shadcn)│  │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────────────┐   │  │
│  │  │ Zustand │ │ TanStack │ │ React Hook Form  │   │  │
│  │  │ (State) │ │ (Query)  │ │ + Zod (Forms)    │   │  │
│  │  └─────────┘ └──────────┘ └──────────────────┘   │  │
│  │  ┌──────────────────────────────────────────┐    │  │
│  │  │  AI Chat Interface + Life Graph Explorer  │    │  │
│  │  └──────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / WebSocket
                         ▼
┌─────────────────────────────────────────────────────────┐
│                     API Gateway                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Next.js API Routes (Route Handlers)               │  │
│  │  Rate Limiting · Auth · CORS · Logging · Metrics  │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Service Layer                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Auth    │ │  Graph   │ │ Planning │ │  AI      │  │
│  │  Service │ │  Service │ │ Service  │ │  Service │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Task    │ │ Routine  │ │ Calendar │ │ Analytics│  │
│  │  Service │ │  Service │ │ Service  │ │  Service │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │  Goal    │ │  Health  │ │  Memory  │               │
│  │  Service │ │  Service │ │  Service │               │
│  └──────────┘ └──────────┘ └──────────┘               │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │  PostgreSQL (Supabase)                            │  │
│  │  ┌──────────────┐ ┌──────────────┐              │  │
│  │  │  Relational  │ │  Graph Views │              │  │
│  │  │  (Prisma)    │ │  (Join-based)│              │  │
│  │  │  └──────────────┘ └──────────────┘              │  │
│  │  ┌──────────────────────────────────────┐       │  │
│  │  │  Full-Text Search · JSONB · Extensions │       │  │
│  │  └──────────────────────────────────────┘       │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Redis (Cache + Session + Real-time)              │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Supabase Storage (Documents, Images, Attachments) │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  External Integrations                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ OpenRouter│ │  Google  │ │  Apple   │ │  Stripe  │  │
│  │ (AI APIs)│ │ Calendar │ │  Health  │ │ (Billing)│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │  Outlook │ │  Fitbit  │ │  Notion  │               │
│  │ Calendar │ │  /Garmin │ │ (Import) │               │
│  └──────────┘ └──────────┘ └──────────┘               │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack Decisions

### 2.1 Frontend

| Technology | Choice Rationale |
|---|---|
| **Next.js (App Router)** | React framework with SSR/SSG, API Routes, Server Components, and Server Actions; App Router for file-based routing and layouts |
| **TypeScript** | Type safety across the entire stack; critical for AI response parsing |
| **Tailwind CSS** | Utility-first; enables rapid Neobrutalism styling; consistent design tokens |
| **shadcn/ui** | Copy-paste component library; full control over styling; Tailwind-native |
| **Zustand** | Minimal boilerplate; excellent TypeScript inference; supports middleware (persist, devtools) |
| **TanStack Query** | Server state management; caching; optimistic updates; background refetching |
| **React Hook Form + Zod** | Performant forms with schema validation; Zod schemas shared with API Routes |

### 2.2 Backend

| Technology | Choice Rationale |
|---|---|
| **Supabase** | PostgreSQL + Auth + Storage + Realtime in one product; reduces operational overhead |
| **Prisma / Drizzle** | Type-safe ORM; Prisma for migrations/schema; Drizzle for query performance where needed |
| **PostgreSQL** | Battle-tested relational DB; JSONB for flexible entity attributes; excellent graph query support (recursive CTEs) |
| **Redis** | Caching; session management; rate limiting; pub/sub for real-time events |

### 2.3 AI

| Technology | Choice Rationale |
|---|---|
| **OpenRouter** | Multi-model access (GPT-4, Claude, Gemini, Llama, etc.); fallback support; cost optimization |
| **Local Models** | Future: on-device inference for sensitive data via Ollama/LMStudio |
| **Embeddings** | For AI memory: vector search over past conversations and user context |

---

## 3. Architectural Principles

### 3.1 Service Isolation
Each domain (goals, tasks, health, etc.) is an isolated service with its own:
- Database schema (Prisma model)
- API endpoints
- Business logic
- Integration tests

### 3.2 Graph-First Data
All entities are stored relationally but queried as a graph. The Life Graph service maintains edge tables capturing typed relationships between any two entities.

### 3.3 Event-Driven AI
The AI Engine is event-driven. Life events (goal completed, task missed, health change, etc.) trigger AI re-evaluation of plans and recommendations.

### 3.4 Offline-First
The client caches all relevant data locally. TanStack Query's persistent cache + Zustand persist middleware enable full offline read access and queue-based write sync.

### 3.5 Security by Design
Every API endpoint enforces:
- Authentication (JWT via Supabase Auth)
- Strict User Data Isolation (only the authenticated owner can access their partition)
- Rate limiting
- Input validation (Zod schema)

---

## 4. Data Flow

### 4.1 User Creates a Goal
```
Frontend → API Gateway → Goal Service → Validate (Zod)
  → Write to PostgreSQL (Prisma) → Life Graph Service (create edges)
  → Publish event "goal.created" → AI Engine (re-plan)
  → Return response → TanStack Query cache update → UI re-render
```

### 4.2 AI Generates Daily Plan (via AI Gateway)
```
User requests daily plan (or scheduled trigger)
  → AI Engine initiates request to AI Gateway (client.ts):
    → Rate Limiter checks sliding-window capacity
    → Response Cache looks up hash (returns if cache hit < 5m)
    → Context Retriever queries active goals, routines, and AI memories
    → Model Router selects medium model (google/gemini-2.5-flash)
    → Gateway sends aggregated request to OpenRouter
  → Parse structured response (Zod schema)
  → Generate tasks in Task Service
  → Schedule in Scheduling Service
  → Update Life Graph
  → Push to frontend & cache in local client store
```

### 4.3 Adaptive Reschedule
```
External calendar event changes
  → Calendar Service detects change
  → Publish event "schedule.changed"
  → AI Engine evaluates impact:
    → Affected time blocks
    → Task dependencies
    → Energy/mood context
    → Priority adjustments
  → Generate new schedule proposal
  → Present to user with explanation
  → User confirms or modifies
  → Apply changes
```

---

## 5. Deployment Architecture

```
┌─────────────────────────┐
│   Vercel                │
│   (Next.js SSR + API)   │
│   CDN · Edge Functions  │
│   Server Actions        │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Supabase Cloud        │
│   PostgreSQL · Auth     │
│   Storage · Realtime    │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Redis Cloud           │
│   Upstash / Redis Labs  │
└─────────────────────────┘
```

---

## 6. Monitoring & Observability

| Tool | Purpose |
|---|---|
| **Sentry** | Error tracking and performance monitoring |
| **PostHog** | Product analytics (self-hosted) |
| **Grafana** | Infrastructure metrics |
| **OpenTelemetry** | Distributed tracing across services |
| **Axiom / Datadog** | Log aggregation |

---

## 7. Related Documents

- [DATABASE.md](./DATABASE.md) — Detailed database schema design
- [ENTITY_RELATIONSHIP.md](./ENTITY_RELATIONSHIP.md) — Entity definitions and relationships
- [LIFE_GRAPH.md](./LIFE_GRAPH.md) — Life Graph architecture
- [AI_ENGINE.md](./AI_ENGINE.md) — AI system architecture
- [SECURITY.md](./SECURITY.md) — Security architecture
- [API_SPEC.md](./API_SPEC.md) — API specifications
