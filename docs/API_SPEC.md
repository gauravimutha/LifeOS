# API Specification

## 1. Overview

LifeOS uses a RESTful API with WebSocket support for real-time updates. All API endpoints are prefixed with `/api/v1`.

**Base URL:** `https://api.lifeos.app/api/v1` (production)

---

## 2. Authentication

All API requests require a JWT token via Supabase Auth:

```
Authorization: Bearer <supabase_jwt>
```

---

## 3. Standard Response Format

### Success

```json
{
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-01-15T10:30:00Z",
    "version": "1.0"
  }
}
```

### List Responses

```json
{
  "data": [ ... ],
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-01-15T10:30:00Z",
    "page": 1,
    "pageSize": 20,
    "total": 142,
    "totalPages": 8
  }
}
```

### Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "title", "message": "Title is required" }
    ],
    "requestId": "req_abc123"
  }
}
```

---

## 4. API Endpoints

### 4.1 Goals

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/goals` | List user's goals |
| `GET` | `/goals/:id` | Get goal details |
| `POST` | `/goals` | Create a goal |
| `PATCH` | `/goals/:id` | Update a goal |
| `DELETE` | `/goals/:id` | Soft-delete a goal |
| `GET` | `/goals/:id/tree` | Get goal subtree |
| `POST` | `/goals/:id/decompose` | AI-decompose goal into sub-goals |
| `POST` | `/goals/:id/progress` | Update goal progress |

**Query Parameters:**
- `level` — Filter by goal level (vision, long_term, yearly, etc.)
- `status` — Filter by status
- `parentId` — Get children of a specific goal
- `domain` — Filter by life domain

**POST /goals Request:**
```json
{
  "title": "Run a half marathon",
  "level": "yearly",
  "parentGoalId": "uuid",
  "description": "Complete a half marathon by December",
  "targetDate": "2026-12-31",
  "domain": "health",
  "priority": 2
}
```

---

### 4.2 Tasks

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/tasks` | List tasks |
| `GET` | `/tasks/:id` | Get task details |
| `POST` | `/tasks` | Create a task |
| `PATCH` | `/tasks/:id` | Update a task |
| `DELETE` | `/tasks/:id` | Soft-delete a task |
| `POST` | `/tasks/:id/complete` | Mark task complete |
| `POST` | `/tasks/:id/defer` | Defer task to new date (increments `deferCount`) |
| `POST` | `/tasks/:id/simplify` | Simplify task into 15-minute micro focus blocks |
| `POST` | `/tasks/batch` | Batch task operations |
| `GET` | `/tasks/daily` | Get today's tasks |
| `GET` | `/tasks/deferred` | Get avoided/deferred tasks requiring Socratic coaching |
| `GET` | `/tasks/contexts` | Get task context groups |

**Query Parameters:**
- `status` — Filter by status
- `priority` — Min priority filter
- `goalId` — Tasks for a specific goal
- `date` — Tasks for a specific date
- `dateFrom` / `dateTo` — Date range

---

### 4.3 Habits

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/habits` | List habits |
| `GET` | `/habits/:id` | Get habit details |
| `POST` | `/habits` | Create a habit |
| `PATCH` | `/habits/:id` | Update a habit |
| `DELETE` | `/habits/:id` | Soft-delete a habit |
| `POST` | `/habits/:id/log` | Log habit completion |
| `GET` | `/habits/:id/logs` | Get habit logs |
| `GET` | `/habits/:id/streak` | Get streak info |

---

### 4.4 Routines

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/routines` | List routines |
| `GET` | `/routines/:id` | Get routine with steps |
| `POST` | `/routines` | Create a routine |
| `PATCH` | `/routines/:id` | Update a routine |
| `DELETE` | `/routines/:id` | Soft-delete a routine |
| `POST` | `/routines/:id/steps` | Add step to routine |
| `PATCH` | `/routines/:id/steps/:stepId` | Update step |
| `DELETE` | `/routines/:id/steps/:stepId` | Remove step |

---

### 4.5 Calendar

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/calendar` | Get calendar events (date range) |
| `GET` | `/calendar/:id` | Get event details |
| `POST` | `/calendar` | Create event |
| `PATCH` | `/calendar/:id` | Update event |
| `DELETE` | `/calendar/:id` | Delete event |
| `POST` | `/calendar/sync` | Trigger external calendar sync |
| `GET` | `/calendar/conflicts` | Get scheduling conflicts |

---

### 4.6 Journal

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/journal` | List journal entries |
| `GET` | `/journal/:id` | Get journal entry |
| `POST` | `/journal` | Create journal entry |
| `PATCH` | `/journal/:id` | Update journal entry |
| `DELETE` | `/journal/:id` | Soft-delete entry |
| `POST` | `/journal/:id/analyze` | AI-analyze journal entry |
| `POST` | `/journal/prompt` | Get AI journal prompt |

---

### 4.7 Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Get health data (date range) |
| `POST` | `/health` | Log health data |
| `PATCH` | `/health/:id` | Update health log |
| `GET` | `/health/summary` | Get health summary |
| `GET` | `/health/trends` | Get health trends |
| `POST` | `/health/import` | Import from Apple Health / Google Fit |

---

### 4.8 AI

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/ai/chat` | Send chat message |
| `POST` | `/ai/plan` | Request AI to generate/update plan |
| `POST` | `/ai/suggest` | Get AI suggestions |
| `POST` | `/ai/analyze` | AI deep analysis |
| `POST` | `/ai/decompose` | Decompose goal into sub-goals |
| `POST` | `/ai/review` | Generate review (daily/weekly/monthly) |
| `GET` | `/ai/sessions` | List AI chat sessions |
| `DELETE` | `/ai/sessions/:id` | Delete chat session |

**POST /ai/chat Request:**
```json
{
  "sessionId": "uuid",
  "message": "What should I focus on today?",
  "context": {
    "includePlan": true,
    "includeHealth": true,
    "includeGoals": true
  }
}
```

**POST /ai/chat Response (streaming):**
```json
{
  "sessionId": "uuid",
  "messageId": "uuid",
  "content": "Based on your goals and today's energy...",
  "actions": [
    { "type": "view_plan", "label": "View Updated Plan" }
  ],
  "metadata": {
    "model": "gpt-4o",
    "tokens": 450,
    "confidence": 0.85
  }
}
```

---

### 4.9 Planning

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/plans/current` | Get current active plan |
| `GET` | `/plans/:id` | Get plan by ID |
| `POST` | `/plans/generate` | Generate new plan |
| `PATCH` | `/plans/:id` | Update plan |
| `POST` | `/plans/:id/adapt` | Trigger adaptive rescheduling |
| `POST` | `/plans/:id/approve` | Approve AI-generated plan |

---

### 4.10 Life Graph

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/graph/node` | Get graph node details |
| `GET` | `/graph/neighbors` | Get neighboring entities |
| `GET` | `/graph/path` | Find path between entities |
| `GET` | `/graph/subgraph` | Get subgraph for entity |
| `GET` | `/graph/stats` | Get graph statistics |

---

### 4.11 AI Memory

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/memory` | List AI memories |
| `GET` | `/memory/:id` | Get memory details |
| `PATCH` | `/memory/:id` | Update memory |
| `DELETE` | `/memory/:id` | Delete memory |
| `GET` | `/memory/search` | Semantic search memories |

---

### 4.12 Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics/dashboard` | Get dashboard data |
| `GET` | `/analytics/domain-balance` | Get domain balance scores |
| `GET` | `/analytics/trends` | Get trend data |
| `GET` | `/analytics/goal-progress` | Get goal progress analytics |

---

### 4.13 Reviews

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/reviews/daily` | Get daily review details for a given date |
| `POST` | `/reviews/daily` | Submit daily reflection, mood score, wins, and blockers |
| `GET` | `/reviews/weekly` | Fetch the AI Chief of Staff Weekly Intelligence Letter |
| `POST` | `/reviews/period` | Generate quarterly or monthly period reviews |

---

## 5. WebSocket Events

### 5.1 Client → Server

| Event | Payload | Description |
|---|---|---|
| `ai.chat.stream` | `{ sessionId, message }` | Start AI chat stream |
| `plan.subscribe` | `{ planId }` | Subscribe to plan updates |
| `plan.changes` | `{ planId, changes }` | Send plan changes |

### 5.2 Server → Client

| Event | Payload | Description |
|---|---|---|
| `ai.chat.token` | `{ messageId, token }` | Streaming AI token |
| `ai.chat.done` | `{ messageId }` | AI response complete |
| `plan.updated` | `{ planId, diff }` | Plan was updated |
| `plan.adapting` | `{ planId, reason }` | AI is adapting plan |
| `plan.adapted` | `{ planId, plan }` | Plan adaptation complete |
| `goal.progress` | `{ goalId, progress }` | Goal progress changed |
| `task.status` | `{ taskId, status }` | Task status changed |
| `notification` | `{ type, title, body }` | User notification |
| `memory.updated` | `{ memoryKey }` | AI memory updated |

---

## 6. Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `AI_ERROR` | 500 | AI service error |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## 7. Rate Limiting

| Endpoint Group | Limit | Window |
|---|---|---|
| Standard API | 100 req/min | Per user |
| AI Chat | 30 req/min | Per user |
| AI Planning | 10 req/min | Per user |
| Calendar Sync | 5 req/min | Per user |
| Analytics | 60 req/min | Per user |

---

## 8. Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Backend service architecture
- [SECURITY.md](./SECURITY.md) — API security measures
- [DATABASE.md](./DATABASE.md) — Data models backing the API
- [AI_ENGINE.md](./AI_ENGINE.md) — AI API operations
