# Changelog

All notable changes to the LifeOS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added

- **Documentation**: Complete product documentation (29 documents)
  - Product vision, mission, and PRD
  - System architecture and tech stack decisions
  - Database schema with 20+ entity tables
  - Life Graph data model with typed edges
  - Goal System (vision → weekly hierarchy)
  - Task Engine with AI generation
  - AI Engine with model-agnostic routing
  - AI Personality with 10 role fusion
  - AI Memory with semantic retrieval
  - Decision Engine with trade-off analysis
  - Planning Engine (yearly → daily)
  - Scheduling Engine with energy-aware algorithms
  - Routine Engine with adaptive timing
  - UI/Design system (Modern Neobrutalism)
  - Component library with 60+ components
  - API specification with WebSocket events
  - Security architecture (encryption, auth)
  - Strict account-level data isolation
  - Analytics and Life Scores
  - Life Modes (9 modes)
  - Development roadmap (5 phases)

### Technical

- Initial project structure setup
- Documentation-driven development approach

## [0.2.0] - 2026-07-04

### Added

- **Onboarding Redesign (Step 1-8)**: Unified authentication step, goals selection, life stage definition, routines, and a premium Review & Edit dashboard allowing goals, tasks, and routines database persistence.
- **AI Gateway & Model Router**: Centralized AI traffic gateway with rate-limiting constraints, sliding window checks, dynamic user context extraction (active goals, preferences), response cache layer (5m TTL), and model size routing.
- **Goal Conflict & Bandwidth Checks**: Cross-goal conflict detection (e.g. CAT prep vs Startup, GRE vs CAT) and total focus hours safety thresholds.
- **One Thing That Matters (MIT)**: Daily MIT focus highlights explaining why the task is critical to long-term success.
- **Reflection Engine**: Evening check-in card asking "How did today go?" that parses logs and updates AI memories (wins, lessons).
- **Burnout Safety Valve (Recovery Mode)**: Warns users when daily task hours exceed 8 hours and defers high-focus tasks automatically.
- **Socratic Accountability Partner**: Monitors task deferrals and prompts to simplify tasks or shift them with supportive, curious coaching.
- **Weekly AI Letter**: Personalized executive weekly report.
- **Predictions & Future Self Vision**: Predictive outcome forecasts and 5-year vision statement editor.

### Technical

- Created `/api/tasks/deferred`, `/api/tasks/[id]/simplify`, `/api/reviews/weekly` endpoints.
- Updated `/api/plans/generate`, `/api/reviews/daily`, `/api/tasks/[id]/defer` endpoints.
- Integrated AI Gateway and Model Router inside `src/services/ai/client.ts`.

---

## [0.0.1] - 2026-07-03

### Added

- Project initialized
- `/docs` directory created with 29 documentation files
- Architecture decisions documented
- Design system specifications defined
- Development roadmap established

---

*LifeOS is in pre-development. No code has been written. All work to date is documentation and design.*

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
