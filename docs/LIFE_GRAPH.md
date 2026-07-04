# Life Graph

## 1. Overview

The Life Graph is the core data structure of LifeOS. Instead of isolated database tables, all user entities exist as nodes in a connected graph with typed, weighted edges representing semantic relationships.

The AI reasons over this graph to understand context, dependencies, trade-offs, and impact across all domains of a user's life.

---

## 2. Architecture

### 2.1 Dual Storage Model

The Life Graph uses a **hybrid approach**:

| Storage | Purpose |
|---|---|
| **Relational Tables (PostgreSQL)** | Primary data storage; normalized entities with foreign keys |
| **Edge Table (life_graph_edges)** | Arbitrary typed relationships between any entity types |
| **Graph View (recursive CTEs)** | On-the-fly graph traversal for relationship queries |
| **Vector Embeddings (pgvector)** | Semantic similarity search across entities |

### 2.2 Why Not a Dedicated Graph Database?

| Consideration | Decision |
|---|---|
| **Operational complexity** | Adding Neo4j or similar increases infrastructure complexity significantly |
| **Transaction consistency** | Relational ACID guarantees are critical for financial and health data |
| **Query patterns** | Most graph queries are shallow (2-3 hops) and well-served by recursive CTEs |
| **Team expertise** | PostgreSQL + CTEs is more accessible than a dedicated graph DB |
| **Future migration** | Edge table pattern allows easy migration to a graph DB later if needed |

### 2.3 When to Consider Graph DB Migration

- Deep graph traversals (>5 hops) become performance bottlenecks
- Real-time graph analytics at scale (100K+ nodes)
- Complex path-finding algorithms (shortest path, centrality, community detection)

---

## 3. Graph Structure

### 3.1 Nodes

Every row in the entity tables becomes a node in the graph. The node identity is `(entity_type, entity_id)`.

```typescript
interface GraphNode {
  entityType: 'goal' | 'task' | 'habit' | 'routine' | 'calendar_event'
    | 'journal_entry' | 'health_data' | 'relationship' | 'project'
    | 'memory' | 'resource' | 'achievement';
  entityId: string; // UUID
  label: string; // Human-readable name
  properties: Record<string, any>; // Subset of entity attributes
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 Edges

Edges are stored in the `life_graph_edges` table. Each edge has:
- Source (entity type + ID)
- Target (entity type + ID)
- Type (semantic relationship)
- Weight (strength of connection, 0.0 to 1.0)
- Metadata (extensible properties)

```typescript
interface GraphEdge {
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  edgeType: EdgeType; // 'supports' | 'depends_on' | 'blocks' | ...
  weight: number; // 0.0 to 1.0
  metadata?: Record<string, any>;
}
```

### 3.3 Visual Representation

```
                         [VISION]
                            │ parent_of
                            ▼
                    [LONG-TERM GOAL]
                    ┌────┴────┐────┐
                    │         │    │
              parent_of   parent_of supports
                    │         │    │
                    ▼         ▼    ▼
              [YEARLY G1] [YEARLY G2] [HABIT: Exercise]
                    │         │            │ supports
              parent_of   parent_of        │
                    │         │            ▼
                    ▼         ▼       [GOAL: Health]
              [QUARTERLY] [QUARTERLY]      │
                    │         │        measures
              parent_of   parent_of        │
                    │         │            ▼
                    ▼         ▼       [HEALTH_DATA]
              [MONTHLY]   [MONTHLY]     (daily logs)
                    │         │
               supports   supports
                    │         │
                    └────┬────┘
                         │
                         ▼
                    [TASK: Do X]
                         │
                    depends_on
                         │
                         ▼
                    [TASK: Do Y first]
```

---

## 4. Graph Service API

### 4.1 Core Operations

```typescript
// Add a node to the graph
graphService.addNode(entityType, entityId, properties);

// Remove a node (soft delete edges)
graphService.removeNode(entityType, entityId);

// Create an edge between two nodes
graphService.createEdge(source, target, edgeType, weight?);

// Remove an edge
graphService.removeEdge(edgeId);

// Update edge weight/metadata
graphService.updateEdge(edgeId, updates);
```

### 4.2 Query Operations

```typescript
// Get direct neighbors
graphService.getNeighbors(entityType, entityId, {
  direction: 'incoming' | 'outgoing' | 'both',
  edgeTypes?: EdgeType[],
  maxDepth?: number, // default 1
});

// Traverse the graph to a given depth
graphService.traverse(entityType, entityId, {
  maxDepth: 3,
  edgeTypes: ['supports', 'depends_on'],
  direction: 'outgoing',
});

// Find paths between two nodes
graphService.findPaths(sourceType, sourceId, targetType, targetId, {
  maxDepth: 5,
  edgeTypes?: EdgeType[],
});

// Get subgraph for a domain (e.g., all health-related entities)
graphService.getSubgraph({
  rootType: 'goal',
  rootId: goalId,
  maxDepth: 3,
});

// Semantic search (via vector embeddings)
graphService.semanticSearch(query, {
  limit: 10,
  entityTypes?: string[],
});
```

### 4.3 Event-Driven Updates

The graph automatically creates edges when:

| Event | Edges Created |
|---|---|
| Task assigned to a goal | `task --supports--> goal` |
| Project created under a goal | `project --supports--> goal` |
| Habit linked to a goal | `habit --supports--> goal` |
| Task depends on another | `task_a --depends_on--> task_b` |
| Journal entry references a goal | `journal --relates_to--> goal` |
| Health data logged | `health_data --measures--> goal(s)` |
| Routine step creates a task | `routine_step --generates--> task` |
| Calendar event blocks time | `calendar_event --conflicts_with--> task` |

---

## 5. Graph Intelligence

### 5.1 Tension Detection

The AI uses the Life Graph to detect tensions:

```sql
-- Find goals that compete for resources
SELECT g1.title as goal_a, g2.title as goal_b,
       e1.weight + e2.weight as tension_score
FROM life_graph_edges e1
JOIN goals g1 ON g1.id = e1.source_entity_id
JOIN life_graph_edges e2 ON e2.source_entity_id = e1.target_entity_id
  AND e2.target_entity_id = e1.source_entity_id
JOIN goals g2 ON g2.id = e2.source_entity_id
WHERE e1.edge_type = 'conflicts_with'
  AND e2.edge_type = 'conflicts_with'
ORDER BY tension_score DESC;
```

### 5.2 Impact Analysis

When considering a recommendation, the AI analyzes:

1. **Direct impact:** What entities does this action directly affect?
2. **First-order effects:** What entities are one hop away?
3. **Second-order effects:** What entities are two hops away?
4. **Cumulative weight:** Sum of weighted impacts across all affected paths

### 5.3 Pattern Recognition

The AI identifies patterns by analyzing graph sub-structures:

- **Goal clusters:** Groups of interconnected goals → potential focus areas
- **Bottlenecks:** Tasks with high `depends_on` incoming edges → critical path items
- **Isolated nodes:** Entities with no edges → potential forgotten areas
- **Healthy loops:** Positive feedback cycles (habit → health → energy → habit)
- **Vicious cycles:** Negative feedback loops (stress → poor sleep → low energy → stress)

---

## 6. Graph Health

### 6.1 Maintenance

- **Orphan detection:** Periodic scanning for nodes with no edges (except very new ones)
- **Weight decay:** Edge weights decrease over time without interaction; require reinforcement
- **Edge pruning:** Remove edges where weight drops below threshold (0.1) for >90 days
- **Reconciliation:** After bulk imports, verify graph connectivity

### 6.2 Metrics

| Metric | Description | Target |
|---|---|---|
| **Node count** | Total entities in user's graph | N/A |
| **Edge density** | Edges per node | > 2.0 (well-connected) |
| **Connectivity** | % of nodes reachable from top-level goals | > 90% |
| **Freshness** | % of nodes touched in last 30 days | > 60% |
| **Orphan rate** | % of nodes with 0 edges | < 5% |

---

## 7. Related Documents

- [DATABASE.md](./DATABASE.md) — Edge table DDL and schema
- [ENTITY_RELATIONSHIP.md](./ENTITY_RELATIONSHIP.md) — Entity definitions and relationship types
- [AI_ENGINE.md](./AI_ENGINE.md) — How the AI uses the Life Graph for reasoning
- [GOAL_SYSTEM.md](./GOAL_SYSTEM.md) — Goal hierarchy integrated with the graph
