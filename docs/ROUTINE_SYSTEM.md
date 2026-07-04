# Routine System

## Weekly Time Blocks

Users define their weekly schedule with time blocks. Each block has:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID |
| `dayOfWeek` | number | 0=Sunday, 6=Saturday |
| `startTime` | string | "HH:MM" format |
| `endTime` | string | "HH:MM" format |
| `label` | string | Human-readable name |
| `category` | RoutineCategory | College \| Work \| Gym \| Family \| Friends \| Relationship \| Reading \| Meditation \| Meals \| Sleep \| Commute \| Hobbies \| Downtime \| Other |
| `isProtected` | boolean | If true, AI will not schedule tasks during this time |

## AI Integration

When the AI coach generates suggestions, it receives today's time blocks with status:

- **ONGOING** — currently in progress
- **PASSED** — already ended
- **UPCOMING** — later today
- **PROTECTED** — marked as protected (no tasks)

The AI is instructed to avoid scheduling tasks during protected blocks.

## Life Modes

Users can switch between 10 life modes. The current mode is included in the AI prompt context.

| Mode | Icon | Use Case |
|------|------|----------|
| Normal | Sun | Default everyday mode |
| College | GraduationCap | Regular college schedule |
| Placement | Briefcase | Job preparation phase |
| GATE | BookOpen | GATE exam preparation |
| GRE | Globe | GRE exam preparation |
| Startup | Rocket | Building a startup |
| Exam | FileText | General exam period |
| Vacation | Umbrella | Time off |
| Recovery | Heart | Mental/physical recovery |
| Festival | Sparkles | Holidays and celebrations |

Modes do not change the data model — they inform the AI's prioritization logic via the prompt.
