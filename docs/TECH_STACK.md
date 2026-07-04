# Tech Stack

## Framework

| Choice | Rationale |
|--------|-----------|
| **Next.js 16** (App Router) | File-based routing, API routes, server components |
| **TypeScript** (strict) | Type safety across stores, components, and API |
| **Turbopack** | Fast dev server and production builds |

## UI & Styling

| Choice | Rationale |
|--------|-----------|
| **Tailwind CSS v4** | Utility-first, CSS with PostCSS plugin |
| **@tailwindcss/postcss** | Required for Next.js compatibility with Tailwind v4 |
| **lucide-react** | Lightweight, Tree-shakeable icon library |

## State Management

| Choice | Rationale |
|--------|-----------|
| **Zustand** | Minimal boilerplate, selective subscriptions (no re-render chains) |
| **zustand/middleware/persist** | localStorage persistence with version migration |

## AI

| Choice | Rationale |
|--------|-----------|
| **OpenRouter** | Single API for multiple models, no vendor lock-in |
| **google/gemini-2.0-flash-lite** | Fast, cheap, sufficient quality for coaching and planning |
| **Server-side proxy** | API key never exposed to client |

## Why Not...

| Library | Reason Not Used |
|---------|-----------------|
| Redux | Too much boilerplate for this scale |
| React Query | No server state to manage |
| Prisma / Supabase | No backend database — localStorage-only for now |
| Framer Motion | Adds bundle size; CSS transitions suffice |
| Next.js API routes vs tRPC | Only 1 endpoint, tRPC overhead not justified |
