# UI & UX Guidelines

## Design Principles

1. **Progressive disclosure.** Start simple. Show advanced fields only when needed.
2. **AI-first.** Prefer AI inference over user input. Default to smart defaults.
3. **Responsive by default.** Mobile-first, desktop-enhanced.
4. **Reduce cognitive load.** One primary action per screen. Clear hierarchy.
5. **Instant feedback.** Toast notifications for creates, deletes, and errors.

## Layout

- **Desktop:** Fixed sidebar (w-52) on left, main content fills remaining width.
- **Mobile:** Hamburger menu opens sidebar as overlay drawer. Main content full-width.
- **Dialogs:** Centered on desktop (`items-center`), bottom-sheet on mobile (`items-end`).
- **Content max-width:** No global `max-w-*` constraint. Content fills available width.

## Responsive Patterns

| Pattern | Mobile | Tablet / Desktop |
|---------|--------|------------------|
| Sidebar | Overlay drawer (hamburger) | Fixed w-52 |
| Dialog | Bottom-sheet (`rounded-t-xl`) | Centered modal (`rounded-xl`) |
| AI Panel | Full-width (`w-full`) | `max-w-md` right panel |
| Stat Cards | 2-column grid | 4-column grid |
| Routine Grid | 1 column | 2-4 columns (responsive) |
| Goal Card sections | 1 column | 2 columns |

## Color System

Uses CSS variables via Tailwind's `bg-background`, `text-foreground`, `bg-card`, `bg-secondary`, `text-muted-foreground`, etc. for theme support.

- **Primary:** Blue (accent for buttons, links, active states)
- **Danger:** Red (delete actions, overdue indicators)
- **Success:** Green (completed, streaks)
- **Warning:** Amber (protected blocks, paused status)
- **Info:** Indigo / Purple (stats, insights)

## Typography

- **Headings:** `text-xl sm:text-2xl font-semibold tracking-tight`
- **Labels:** `text-xs font-medium` or `text-[10px] uppercase tracking-wider`
- **Body:** `text-sm`
- **Secondary:** `text-xs text-muted-foreground`

## Component Patterns

- **Cards:** `rounded-xl border bg-card p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow`
- **Buttons:** `rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90`
- **Inputs:** `rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring`
- **Badges:** `text-xs font-medium px-1.5 py-0.5 rounded bg-secondary/50`
- **Progress bars:** `h-1.5 rounded-full bg-secondary overflow-hidden` + inner `bg-primary`

## Loading & Empty States

- **No data:** Centered icon + message (e.g., `Target` icon + "No goals yet.")
- **Loading:** `Loader2` icon with `animate-spin`
- **Errors:** Red alert box with `AlertCircle` icon
