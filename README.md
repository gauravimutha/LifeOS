# 🎯 LifeOS — AI-Enhanced Life Operating System

> **"Stop planning your life. Start living it."**
> LifeOS is a premium, AI-powered Personal Chief of Staff designed to help individuals consistently make the best decisions every day, achieve long-term outcomes, and maintain a balanced life without cognitive overload.

---

## 🗺️ Product Vision & Philosophy

**This is NOT a todo app, a calendar, or a habit tracker.** Those are only modules.

LifeOS is an **Operating System** built around one core behavioral loop:
$$\text{🎯 Goals} \longrightarrow \text{🗺️ Roadmaps} \longrightarrow \text{✅ Tasks} \longrightarrow \text{📅 Today's Schedule}$$

### Core Tenets:
1. **Goal-Oriented Planning:** The user defines high-level outcomes (goals). The AI generates the required roadmaps, milestones, and daily tasks. The user manages goals; the AI handles the organization.
2. **Intentional Schedules:** "Today's Schedule" is the heart of the system. It is not a list of tasks to check off, but rather the answer to: *"What is the highest quality way to spend today?"*
3. **Adaptive Planning:** Life happens. If a user travels, gets sick, sleep-deprived, or interrupted, the system automatically adapts and regenerates affected schedules without requiring manual re-planning.

---

## ⚡ Key Features

### 1. NeoBrutalist Landing Page
A premium, conversion-optimized landing page with high-fidelity, interactive components:
*   **AI Intent-to-Roadmap Simulator:** Type a custom life vision (or click presets like *"Crack CAT & lose weight"*) to witness the AI analyze focus domains, decompose milestones, and generate a day plan.
*   **Daily Schedule Interruption Optimizer:** Choose real-world disruptions (e.g., *"Slept 4 hours last night"*, *"Got Sick"*, or *"Unexpected meeting added"*) and watch the timeline dynamically shift and optimize.
*   **Live App Previews:** Interactive, fully tabbed screens simulating the Dashboard, AI Coach Chat, Roadmaps, and Analytics.

### 2. Interactive Dashboard
*   **Check-Ins:** Interactive morning reflection and evening review widgets to track focus energy, mood, and daily metrics.
*   **Daily Planner:** Calendar timelines showing deep work, exercise, meetings, and recovery blocks.
*   **Milestones & Habits:** Quick-check interfaces for active roadmaps and habit streaks.

### 3. User Management Admin Dashboard
A robust administration dashboard at `/admin` featuring:
*   **Global Telemetry:** Global metrics showing user registrations, active goals, and task completion metrics.
*   **User Directory:** Directory listing showing names, emails, timezones, and onboarding states.
*   **Interactive Search & Filters:** Real-time client-side search and status filters (All, Active, Pending Onboarding, Deactivated).
*   **CRUD Actions:**
    *   **Create User Modal:** Instantly register users with validation and duplicate email checks.
    *   **Edit User Details Modal:** Modify names, emails, timezones, and onboarding states.
    *   **Quick-Toggle Onboarding:** Toggle user onboarding completed state instantly from the directory row.
    *   **Deactivate & Restore Toggle:** Soft-deletes a user (blocking logins) or restores them in a single click.

### 4. Centralized AI Gateway
*   Centralized context retrieval, cached memories, prompt builders, and API rate limiting.
*   Model routing through OpenRouter, selecting the cheapest capable model dynamically.

---

## 🛠️ Technology Stack

*   **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS v4, Zustand (State Management), Lucide Icons, Vanilla CSS transitions.
*   **Database & ORM:** PostgreSQL database with Prisma ORM.
*   **Linter:** Oxlint (superfast JS/TS linter).

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Node.js (v18+ recommended) and a PostgreSQL database instance running.

### 2. Installation
Clone the repository and install the dependencies:
```bash
# Install NPM packages
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory:
```env
# Database connection URL
DATABASE_URL="postgresql://username:password@localhost:5432/lifeos"

# Base API URL
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"

# OpenRouter Configuration (server-side only)
OPENROUTER_API_KEY="your-openrouter-key"
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
```

### 4. Database Setup
Push the database schema and generate the Prisma Client:
```bash
# Push schema changes
npm run db:push

# Generate client bindings
npm run db:generate
```

### 5. Running the Application
Run the Next.js dev server:
```bash
# Run local dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build compilation
To build for production:
```bash
# Build NextJS production bundle
npm run build
```

---

## 🔑 Local Testing Account
Use these credentials to sign in and test the dashboard locally:
*   **Email:** `test1@ex.com`
*   **Password:** *Any password* (the local mock authorization route verifies only the email matches an active user record, permitting any text in the password input).

---

## 📐 Architecture & Engineering Constitution

All development is guided by the **LifeOS Constitutional rules** in `AGENTS.md`:
*   **AI-Enhanced, NOT Dependent:** Keep core scheduling, conflict detection, and progress algorithms deterministic and written in TypeScript. Use AI exclusively for natural language processing, strategy reflection, and coaching.
*   **Centralized AI Gateway:** All LLM requests flow through a unified gateway for caching, token logging, and rate limiting.
*   **Optimized Performance:** Paginated reads, indexed tables, and cached data structures to minimize server overhead.
