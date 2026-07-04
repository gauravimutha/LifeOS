# Entity Relationship Diagram

## 1. Core Entity Map

The LifeOS data model is fundamentally a **hybrid graph-relational model**. Entities are stored in normalized relational tables but connected through an edge table (`life_graph_edges`) that allows arbitrary typed relationships between any two entities.

### 1.1 User-Centric Entity Diagram

```
USER
├── GOALS (1:M)
│   │   └── Sub-Goals (self-referential, 1:M)
│   ├── PROJECTS (1:M)
│   │   └── Linked to GOALS (M:1)
│   ├── TASKS (1:M)
│   │   ├── Linked to GOALS (M:1)
│   │   ├── Linked to PROJECTS (M:1)
│   │   ├── Sub-Tasks (self-referential, 1:M)
│   │   └── Linked to ROUTINE_STEPS (M:1)
│   ├── HABITS (1:M)
│   │   ├── Linked to GOALS (M:1)
│   │   └── Habit Logs (1:M)
│   ├── ROUTINES (1:M)
│   │   └── Routine Steps (1:M)
│   │       └── Linked to TASKS (1:1, optional)
│   ├── CALENDAR_EVENTS (1:M)
│   ├── JOURNAL_ENTRIES (1:M)
│   ├── HEALTH_DATA (1:M by date)
│   ├── RELATIONSHIPS (1:M)
│   │   └── Relationship Touchpoints (1:M)
│   ├── AI_MEMORY (1:M)
│   ├── AI_CHAT_MESSAGES (1:M)
│   └── AI_EMBEDDINGS (1:M)
└── ANALYTICS_EVENTS (1:M)
```

---

## 2. Type Definitions

### 2.1 Entity Types

| Entity Type | Table | Description |
|---|---|---|
| `user` | `users` | Human user account |
| `goal` | `goals` | Hierarchical goal (vision → weekly) |
| `project` | `projects` | Multi-step initiative linked to goals |
| `task` | `tasks` | Actionable unit of work |
| `habit` | `habits` | Recurring behavior to build or quit |
| `routine` | `routines` | Structured sequence of activities |
| `routine_step` | `routine_steps` | Individual step within a routine |
| `calendar_event` | `calendar_events` | Time-blocked event |
| `journal_entry` | `journal_entries` | Reflective writing entry |
| `health_data` | `health_data` | Daily health metrics |
| `relationship` | `relationships` | Person in user's life |
| `touchpoint` | `relationship_touchpoints` | Interaction with a relationship |
| `memory` | `ai_memory` | AI-stored user fact/preference |
| `resource` | `resources` | Documents, links, files (future) |
| `achievement` | `achievements` | Milestone / accomplishment (future) |

### 2.2 Edge Types (Life Graph Relationships)

| Edge Type | Meaning | Example |
|---|---|---|
| `parent_of` | Hierarchical containment | Vision → Long-Term Goal |
| `supports` | Entity contributes to another | Habit → Goal |
| `depends_on` | Entity requires another | Task → Task |
| `relates_to` | General association | Journal → Goal |
| `blocks` | Entity prevents another | Task blocking another |
| `precedes` | Temporal ordering | Morning routine → Work |
| `follows` | Temporal ordering | Work → Evening routine |
| `conflicts_with` | Competing or incompatible | Goal A vs Goal B (time/resource) |
| `improves` | Positive influence | Exercise → Health |
| `harms` | Negative influence | Stress → Sleep |
| `requires` | Prerequisite | Task → Resource |
| `generates` | Produces as output | Project → Achievement |
| `measures` | Tracks progress toward | Health Data → Health Goal |
| `belongs_to` | Membership/ownership | Task → Project |
| `references` | Cross-reference | Journal → Task |

---

## 3. Relationship Matrix

```
                ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
                │Goal │ Proj│ Task│ Hab │ Rout│ Cal │ Jnl │ Hlth│ Rel │
├───────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ Goal          │  P  │  S  │  S  │  S  │  S  │  R  │  R  │  M  │  R  │
│ Project       │  P  │  P  │  S  │  -  │  -  │  R  │  R  │  -  │  -  │
│ Task          │  S  │  S  │ D,P │  -  │  S  │  -  │  R  │  -  │  -  │
│ Habit         │  S  │  -  │  -  │  -  │  -  │  -  │  R  │  M  │  -  │
│ Routine       │  S  │  -  │  S  │  -  │  -  │  -  │  R  │  M  │  -  │
│ Calendar      │  R  │  R  │  -  │  -  │  -  │  -  │  -  │  -  │  -  │
│ Journal       │  R  │  R  │  R  │  R  │  R  │  -  │  -  │  R  │  R  │
│ Health        │  M  │  -  │  -  │  M  │  M  │  -  │  R  │  -  │  -  │
│ Relationship  │  R  │  -  │  -  │  -  │  -  │  -  │  R  │  -  │  -  │
└───────────────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘

Legend:
  P = parent_of (hierarchical)
  S = supports (contributes to)
  D = depends_on (blocking)
  R = relates_to (general association)
  M = measures (tracks/quantifies)
  - = no direct relationship (usually)
```

---

## 4. Self-Referential Relationships

### 4.1 Goal Hierarchy
```
Vision (level: vision)
  └── Long-Term Goal (level: long_term, parent: vision)
       └── Yearly Goal (level: yearly, parent: long_term)
            └── Quarterly Goal (level: quarterly, parent: yearly)
                 └── Monthly Goal (level: monthly, parent: quarterly)
                      └── Weekly Goal (level: weekly, parent: monthly)
```

### 4.2 Task Hierarchy
```
Task (parent: null)
  ├── Sub-task (parent: Task)
  │   └── Sub-sub-task (parent: Sub-task)
  └── Sub-task (parent: Task)
```

---

## 5. Graph Query Patterns

### 5.1 "Why am I doing this task?"
```sql
-- Trace task up through goal hierarchy
WITH RECURSIVE goal_chain AS (
  SELECT id, title, level, parent_goal_id
  FROM goals
  WHERE id = (SELECT goal_id FROM tasks WHERE id = :task_id)
  UNION ALL
  SELECT g.id, g.title, g.level, g.parent_goal_id
  FROM goals g
  JOIN goal_chain gc ON g.id = gc.parent_goal_id
)
SELECT * FROM goal_chain ORDER BY level DESC;
```

### 5.2 "How will this habit affect my goals?"
```sql
SELECT g.id, g.title, g.level, e.edge_type, e.weight
FROM life_graph_edges e
JOIN goals g ON g.id = e.target_entity_id
WHERE e.source_entity_id = :habit_id
  AND e.source_entity_type = 'habit'
  AND e.target_entity_type = 'goal'
ORDER BY e.weight DESC;
```

### 5.3 "What's blocking this task?"
```sql
SELECT t.id, t.title, t.status
FROM life_graph_edges e
JOIN tasks t ON t.id = e.source_entity_id
WHERE e.edge_type = 'blocks'
  AND e.target_entity_id = :task_id
  AND e.target_entity_type = 'task'
  AND t.status NOT IN ('completed', 'cancelled');
```

### 5.4 "What domains does this journal entry relate to?"
```sql
SELECT e.source_entity_type, COUNT(*) as connection_count
FROM life_graph_edges e
WHERE e.target_entity_id = :journal_id
  AND e.target_entity_type = 'journal_entry'
GROUP BY e.source_entity_type
ORDER BY connection_count DESC;
```

---

## 6. Domain-Specific Relationships

### 6.1 Goal Domain
```
Goal
  parent_of → Goal (sub-goal)
  supports → Goal (aligned goals)
  supports → Project (related projects)
  supports → Habit (supporting habits)
  supports → Routine (supporting routines)
  relates_to → Calendar (key milestones)
  relates_to → Journal (reflections on progress)
  measures → Health Data (health-related goals)
  relates_to → Relationship (relationship goals)
```

### 6.2 Task Domain
```
Task
  parent_of → Task (sub-task)
  depends_on → Task (blocked by)
  blocks → Task (blocking)
  supports → Goal (contributes to)
  belongs_to → Project (part of project)
  supports → Routine (routine step)
  relates_to → Journal (journal about task)
  precedes → Task (must be done before)
  follows → Task (must be done after)
```

### 6.3 Health Domain
```
Health Data
  measures → Goal (health goals)
  improves → Health Data (next day correlation)
  relates_to → Journal (mood/energy notes)
  improves → Habit (habit effectiveness tracking)
  conflicts_with → Task (low energy days)
```

---

## 7. Related Documents

- [DATABASE.md](./DATABASE.md) — Database design and DDL
- [LIFE_GRAPH.md](./LIFE_GRAPH.md) — Life Graph query engine and API
- [GOAL_SYSTEM.md](./GOAL_SYSTEM.md) — Goal hierarchy and management
- [AI_ENGINE.md](./AI_ENGINE.md) — How the AI traverses the graph
