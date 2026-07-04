# Database Design

## 1. Overview

**Database:** PostgreSQL 15+
**ORM:** Prisma (schema management, migrations) + Drizzle (query optimization where needed)
**Extensions:** pgvector (AI embeddings), pgcrypto (encryption), postgis (location, optional)

---

## 2. Schema Principles

1. **Every entity has a UUID primary key** → distributed-friendly, no sequential leaks
2. **Every entity has `createdAt` and `updatedAt` timestamps** → audit trail
3. **Soft deletes** with `deletedAt` timestamp → recoverability, graph integrity
4. **JSONB for flexible attributes** → extensibility without migrations
5. **Edge table for graph relationships** → typed connections between any entities
6. **All user data is user-scoped** → `userId` on every table to guarantee account-level isolation
7. **Encryption at rest** for sensitive fields → PII, health data, journal entries

---

## 3. Core Tables

### 3.1 Users

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  avatar_url    TEXT,
  timezone      TEXT NOT NULL DEFAULT 'UTC',
  locale        TEXT NOT NULL DEFAULT 'en',
  preferences   JSONB NOT NULL DEFAULT '{}',
  ai_settings   JSONB NOT NULL DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  last_active_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);
```

### 3.2 Goals (Hierarchical)

```sql
CREATE TABLE goals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  parent_goal_id  UUID REFERENCES goals(id),
  title           TEXT NOT NULL,
  description     TEXT,
  level           TEXT NOT NULL CHECK (level IN (
                    'vision', 'long_term', 'yearly', 'quarterly',
                    'monthly', 'weekly'
                  )),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
                    'active', 'paused', 'completed', 'cancelled', 'archived'
                  )),
  priority        INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  progress        REAL NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 1),
  start_date      DATE,
  target_date     DATE,
  completed_at    TIMESTAMPTZ,
  tags            TEXT[],
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_parent ON goals(parent_goal_id);
CREATE INDEX idx_goals_level ON goals(level);
CREATE INDEX idx_goals_status ON goals(status);
```

### 3.3 Projects

```sql
CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  goal_id       UUID REFERENCES goals(id),
  title         TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'planning' CHECK (status IN (
                  'planning', 'active', 'paused', 'completed', 'cancelled'
                )),
  priority      INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  start_date    DATE,
  target_date   DATE,
  completed_at  TIMESTAMPTZ,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);
```

### 3.4 Tasks

```sql
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  goal_id         UUID REFERENCES goals(id),
  project_id      UUID REFERENCES projects(id),
  parent_task_id  UUID REFERENCES tasks(id),
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                    'pending', 'approved', 'in_progress', 'completed',
                    'skipped', 'cancelled'
                  )),
  priority        INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  estimated_minutes INTEGER,
  actual_minutes    INTEGER,
  due_date        TIMESTAMPTZ,
  scheduled_start TIMESTAMPTZ,
  scheduled_end   TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  source          TEXT NOT NULL DEFAULT 'manual' CHECK (source IN (
                    'manual', 'ai_suggested', 'ai_generated', 'routine',
                    'habit', 'recurring'
                  )),
  ai_confidence   REAL CHECK (ai_confidence BETWEEN 0 AND 1),
  energy_required INTEGER CHECK (energy_required BETWEEN 1 AND 5),
  context_tags    TEXT[],
  recurrence_rule TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_scheduled ON tasks(scheduled_start);
CREATE INDEX idx_tasks_goal_id ON tasks(goal_id);
```

### 3.5 Habits

```sql
CREATE TABLE habits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  goal_id         UUID REFERENCES goals(id),
  title           TEXT NOT NULL,
  description     TEXT,
  habit_type      TEXT NOT NULL CHECK (habit_type IN (
                    'build', 'quit', 'track'
                  )),
  frequency       TEXT NOT NULL CHECK (frequency IN (
                    'daily', 'weekly', 'weekdays', 'weekends',
                    'custom', 'interval'
                  )),
  frequency_times INTEGER DEFAULT 1,
  frequency_interval_days INTEGER,
  preferred_time  TIME,
  preferred_days  INTEGER[], -- 0=Sun, 1=Mon, ...
  streak          INTEGER NOT NULL DEFAULT 0,
  best_streak     INTEGER NOT NULL DEFAULT 0,
  total_count     INTEGER NOT NULL DEFAULT 0,
  current_missed  INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
                    'active', 'paused', 'archived'
                  )),
  color           TEXT,
  icon            TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
```

### 3.6 Habit Logs

```sql
CREATE TABLE habit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id      UUID NOT NULL REFERENCES habits(id),
  user_id       UUID NOT NULL REFERENCES users(id),
  date          DATE NOT NULL,
  value         REAL, -- for quantifiable habits (minutes, reps, etc.)
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(habit_id, date)
);
```

### 3.7 Routines

```sql
CREATE TABLE routines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  title         TEXT NOT NULL,
  description   TEXT,
  routine_type  TEXT NOT NULL CHECK (routine_type IN (
                  'morning', 'afternoon', 'evening', 'night',
                  'work', 'focus', 'creative', 'exercise',
                  'learning', 'social', 'custom'
                )),
  time_of_day   TIME,
  duration_minutes INTEGER,
  days_of_week  INTEGER[], -- 0=Sun, ... 6=Sat
  is_flexible   BOOLEAN DEFAULT TRUE,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
                  'active', 'paused', 'archived'
                )),
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);
```

### 3.8 Routine Steps

```sql
CREATE TABLE routine_steps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id    UUID NOT NULL REFERENCES routines(id),
  title         TEXT NOT NULL,
  description   TEXT,
  step_order    INTEGER NOT NULL,
  duration_minutes INTEGER,
  task_id       UUID REFERENCES tasks(id),
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.9 Calendar Events

```sql
CREATE TABLE calendar_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  external_id     TEXT, -- foreign calendar event ID
  external_source TEXT CHECK (external_source IN (
                    'google', 'outlook', 'apple', 'ical'
                  )),
  title           TEXT NOT NULL,
  description     TEXT,
  location        TEXT,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  is_all_day      BOOLEAN DEFAULT FALSE,
  is_recurring    BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  status          TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN (
                    'confirmed', 'tentative', 'cancelled'
                  )),
  event_type      TEXT CHECK (event_type IN (
                    'appointment', 'meeting', 'focus_block', 'personal',
                    'family', 'health', 'social', 'travel', 'other'
                  )),
  color           TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_calendar_user_time ON calendar_events(user_id, start_time, end_time);
CREATE INDEX idx_calendar_date_range ON calendar_events(start_time, end_time);
```

### 3.10 Journal Entries

```sql
CREATE TABLE journal_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  title         TEXT,
  content       TEXT NOT NULL,
  entry_type    TEXT NOT NULL DEFAULT 'free' CHECK (entry_type IN (
                  'free', 'gratitude', 'reflection', 'planning',
                  'evening_review', 'morning_intention', 'prompted'
                )),
  mood_before   INTEGER CHECK (mood_before BETWEEN 1 AND 10),
  mood_after    INTEGER CHECK (mood_after BETWEEN 1 AND 10),
  energy_before INTEGER CHECK (energy_before BETWEEN 1 AND 10),
  energy_after  INTEGER CHECK (energy_after BETWEEN 1 AND 10),
  ai_prompt     TEXT,
  ai_response   TEXT,
  tags          TEXT[],
  is_favorite   BOOLEAN DEFAULT FALSE,
  entry_date    DATE NOT NULL,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_journal_user_date ON journal_entries(user_id, entry_date);
```

### 3.11 Health Data

```sql
CREATE TABLE health_data (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  date          DATE NOT NULL,
  sleep_hours   REAL,
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
  energy_level  INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  mood_score    INTEGER CHECK (mood_score BETWEEN 1 AND 10),
  stress_level  INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  steps         INTEGER,
  exercise_minutes INTEGER,
  exercise_type TEXT,
  heart_rate_avg INTEGER,
  heart_rate_resting INTEGER,
  weight_kg     REAL,
  water_glasses INTEGER,
  caffeine      INTEGER, -- cups
  alcohol       INTEGER, -- units
  notes         TEXT,
  source        TEXT CHECK (source IN ('manual', 'apple_health', 'google_fit', 'fitbit', 'garmin', 'oura')),
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date, source)
);
```

### 3.12 Relationships

```sql
CREATE TABLE relationships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  name          TEXT NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
                    'family', 'partner', 'friend', 'colleague',
                    'mentor', 'mentee', 'coach', 'client',
                    'acquaintance', 'other'
                  )),
  contact_info  JSONB,
  importance    INTEGER CHECK (importance BETWEEN 1 AND 5),
  last_contact  TIMESTAMPTZ,
  contact_frequency TEXT CHECK (contact_frequency IN (
                    'daily', 'weekly', 'biweekly', 'monthly',
                    'quarterly', 'yearly', 'custom'
                  )),
  notes         TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);
```

### 3.13 Relationship Touchpoints

```sql
CREATE TABLE relationship_touchpoints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID NOT NULL REFERENCES relationships(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  touchpoint_type TEXT NOT NULL CHECK (touchpoint_type IN (
                    'call', 'message', 'meeting', 'coffee',
                    'meal', 'activity', 'gift', 'other'
                  )),
  note            TEXT,
  date            DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.14 Life Graph Edges

```sql
CREATE TYPE edge_type AS ENUM (
  'parent_of', 'supports', 'depends_on', 'relates_to',
  'blocks', 'precedes', 'follows', 'conflicts_with',
  'improves', 'harms', 'requires', 'generates',
  'measures', 'belongs_to', 'references'
);

CREATE TABLE life_graph_edges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  source_entity_id   UUID NOT NULL,
  source_entity_type TEXT NOT NULL, -- 'goal', 'task', 'habit', etc.
  target_entity_id   UUID NOT NULL,
  target_entity_type TEXT NOT NULL,
  edge_type       edge_type NOT NULL,
  weight          REAL DEFAULT 1.0, -- strength of relationship
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_lge_user ON life_graph_edges(user_id);
CREATE INDEX idx_lge_source ON life_graph_edges(source_entity_id, source_entity_type);
CREATE INDEX idx_lge_target ON life_graph_edges(target_entity_id, target_entity_type);
CREATE INDEX idx_lge_type ON life_graph_edges(edge_type);
```

### 3.15 AI Memory

```sql
CREATE TABLE ai_memory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  memory_type     TEXT NOT NULL CHECK (memory_type IN (
                    'fact', 'preference', 'pattern', 'context',
                    'decision', 'feedback', 'insight', 'learning'
                  )),
  key             TEXT NOT NULL, -- semantic key for lookup
  value           JSONB NOT NULL,
  confidence      REAL CHECK (confidence BETWEEN 0 AND 1),
  is_active       BOOLEAN DEFAULT TRUE,
  expires_at      TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  UNIQUE(user_id, key)
);

CREATE INDEX idx_ai_memory_user ON ai_memory(user_id);
CREATE INDEX idx_ai_memory_type ON ai_memory(memory_type);
```

### 3.16 AI Chat Messages

```sql
CREATE TABLE ai_chat_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  session_id    UUID NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content       TEXT NOT NULL,
  model         TEXT, -- which AI model generated this
  tokens_used   INTEGER,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_session ON ai_chat_messages(session_id);
CREATE INDEX idx_chat_user ON ai_chat_messages(user_id);
```

### 3.17 AI Embeddings

```sql
-- Requires pgvector extension
CREATE TABLE ai_embeddings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  source_type     TEXT NOT NULL, -- 'journal', 'task', 'memory', 'chat'
  source_id       UUID NOT NULL,
  embedding       vector(1536), -- OpenAI embedding dimension
  content         TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_embeddings_user ON ai_embeddings(user_id);
CREATE INDEX idx_embeddings_vector ON ai_embeddings USING ivfflat (embedding vector_cosine_ops);
```

### 3.18 Analytics Events

```sql
CREATE TABLE analytics_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  event_type    TEXT NOT NULL,
  event_data    JSONB NOT NULL DEFAULT '{}',
  session_id    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);
```

---

## 4. Prisma Schema Notes

The Prisma schema will mirror these tables with:
- `@id` for UUIDs
- `@default(now())` for timestamps
- `@updatedAt` for update timestamps
- Relations defined for direct lookups
- `Json` type for JSONB fields
- `Unsupported()` types for pgvector (`vector(1536)`)

---

## 5. Migration Strategy

1. **Development:** `prisma migrate dev` — auto-generated migrations from schema changes
2. **Staging:** `prisma migrate deploy` — applies all pending migrations
3. **Production:** `prisma migrate deploy` — zero-downtime migrations via shadow database

---

## 6. Related Documents

- [ENTITY_RELATIONSHIP.md](./ENTITY_RELATIONSHIP.md) — Detailed entity definitions and relationships
- [LIFE_GRAPH.md](./LIFE_GRAPH.md) — Life Graph query patterns
- [ARCHITECTURE.md](./ARCHITECTURE.md) — System architecture
- [SECURITY.md](./SECURITY.md) — Encryption and security practices
