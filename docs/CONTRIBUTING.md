# Contributing to LifeOS

## 1. Overview

LifeOS follows a **documentation-driven development** process. Before any code is written, the documentation must be created or updated. This ensures every team member understands the "why" before the "how".

---

## 2. Development Philosophy

### 2.1 Documentation First

```
1. Understand the problem → Write/update docs
2. Design the solution → Write/update ARCHITECTURE.md
3. Implement → Write code matching the docs
4. Verify → Tests pass, docs still accurate
5. Review → Code review + doc review
```

### 2.2 Single Source of Truth

The `/docs` directory is the **single source of truth** for the entire application. If the code and docs disagree, the docs take precedence and the code should be updated.

### 2.3 Core Principles

- Meaning over productivity
- Cognitive load is the enemy
- Connection over isolation
- Empowerment, not dependency
- Quality over speed

---

## 3. Getting Started

### 3.1 Prerequisites

- Node.js 20+
- npm 9+
- Supabase account (for backend work)
- OpenRouter API key (for AI features)

### 3.2 Setup

```bash
# Clone the repository
git clone <repo-url>
cd lifeos

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development
npm run dev
```

### 3.3 First Tasks

1. Read `/docs/README.md` — Understand the project
2. Read `/docs/MISSION.md` — Understand the principles
3. Read `/docs/ARCHITECTURE.md` — Understand the system
4. Find a task in the roadmap (`/docs/ROADMAP.md`)
5. Create a branch: `git checkout -b feature/your-feature-name`

---

## 4. Workflow

### 4.1 Feature Development

1. **Update documentation** — Document the feature in relevant docs
2. **Create issue** — Describe what and why
3. **Design review** — Get feedback from team
4. **Implement** — Write code matching the docs
5. **Test** — Unit + integration tests
6. **Update docs** — Ensure accuracy after implementation
7. **Open PR** — Reference the issue

### 4.2 Documentation Changes

All documentation changes follow the same PR process as code changes.

### 4.3 AI-Specific Changes

Changes to AI behavior require:
1. Update `AI_PERSONALITY.md` (personality changes)
2. Update `AI_ENGINE.md` (architecture changes)
3. Update `AI_MEMORY.md` (memory changes)
4. Test with multiple AI models
5. Review against MISSION.md principles

---

## 5. Code Standards

### 5.1 TypeScript

- Strict mode enabled
- No `any` types (use `unknown` if unavoidable)
- Interfaces over types for object shapes
- Zod schemas for runtime validation

### 5.2 React

- Functional components with hooks
- Props typed with TypeScript interfaces
- Server components where possible
- `'use client'` only when necessary

### 5.3 Testing

| Type | Tool | Coverage Target |
|---|---|---|
| Unit tests | Vitest | 80% |
| Integration tests | Testing Library | 70% |
| E2E tests | Playwright | Critical paths |
| AI response tests | Custom | All prompt templates |

### 5.4 Git Conventions

**Branch naming:**
- `feature/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation
- `refactor/description` — Refactoring
- `chore/description` — Maintenance

**Commit messages:**
```
type(scope): description

Examples:
feat(goals): add goal decomposition API
fix(tasks): correct timezone handling in scheduling
docs(architecture): update API flow diagrams
```

---

## 6. Review Process

### 6.1 Code Review Checklist

- [ ] Code follows TypeScript strict mode
- [ ] Zod validation on all inputs
- [ ] Error states handled
- [ ] Loading states included
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] Mobile responsive
- [ ] No console.log / debug code
- [ ] Tests added/updated
- [ ] Documentation updated

### 6.2 Documentation Review Checklist

- [ ] Accurate and up-to-date
- [ ] Cross-references present
- [ ] No assumptions without documentation
- [ ] Consistent with existing docs
- [ ] Clear and understandable

---

## 7. AI Ethics Checklist

Any feature involving AI must pass:

- [ ] Does not manipulate or shame users
- [ ] Explains reasoning transparently
- [ ] User always has final say
- [ ] No dark patterns
- [ ] Respects privacy boundaries
- [ ] Admits uncertainty
- [ ] Promotes sustainable behavior
- [ ] Cannot harm user wellbeing

---

## 8. Questions?

- Read the docs in `/docs`
- Check the project roadmap
- Ask in team chat

---

## 9. License

Proprietary. All rights reserved.
