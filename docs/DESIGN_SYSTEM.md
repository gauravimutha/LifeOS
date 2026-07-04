# Design System

## 1. Overview

LifeOS uses **Modern Neobrutalism** — a design approach that combines the bold, raw aesthetics of brutalism with modern usability, accessibility, and polish.

**Core principles:**
- **Bold but not harsh** — strong visual hierarchy, clear boundaries, approachable
- **Fast and responsive** — every interaction feels instant
- **Accessible** — WCAG AA+ compliance
- **Premium** — high-quality feel without unnecessary ornamentation
- **Reusable** — systematic, consistent, composable

---

## 2. Design Tokens

### 2.1 Color Palette

**Neutral (Primary interface):**

| Token | Hex | Usage |
|---|---|---|
| `--color-bg` | `#FAFAF9` | Page background (light) |
| `--color-bg-secondary` | `#F5F5F4` | Card/section background |
| `--color-bg-tertiary` | `#E7E5E4` | Hover state |
| `--color-surface` | `#FFFFFF` | Elevated surfaces (modals, dropdowns) |
| `--color-border` | `#292524` | Bold borders (neobrutalism signature) |
| `--color-border-light` | `#D6D3D1` | Subtle dividers |
| `--color-text-primary` | `#1C1917` | Primary text |
| `--color-text-secondary` | `#57534E` | Secondary text |
| `--color-text-tertiary` | `#A8A29E` | Placeholder/disabled |
| `--color-text-inverse` | `#FAFAF9` | Text on dark backgrounds |

**Dark mode:**

| Token | Hex | Usage |
|---|---|---|
| `--color-bg-dark` | `#1C1917` | Page background (dark) |
| `--color-bg-secondary-dark` | `#292524` | Card/section background |
| `--color-bg-tertiary-dark` | `#44403C` | Hover state |
| `--color-surface-dark` | `#292524` | Elevated surfaces |
| `--color-border-dark` | `#FAFAF9` | Bold borders |
| `--color-border-light-dark` | `#57534E` | Subtle dividers |
| `--color-text-primary-dark` | `#FAFAF9` | Primary text |
| `--color-text-secondary-dark` | `#A8A29E` | Secondary text |
| `--color-text-tertiary-dark` | `#78716C` | Placeholder/disabled |
| `--color-text-inverse-dark` | `#1C1917` | Text on light backgrounds |

**Accent (Brand):**

| Token | Hex | Usage |
|---|---|---|
| `--color-accent` | `#6366F1` | Primary actions, links, active states |
| `--color-accent-hover` | `#4F46E5` | Hover state |
| `--color-accent-light` | `#EEF2FF` | Subtle accent backgrounds |
| `--color-accent-text` | `#FFFFFF` | Text on accent |

**Semantic colors:**

| Token | Hex | Usage |
|---|---|---|
| `--color-success` | `#16A34A` | Completed, positive |
| `--color-warning` | `#D97706` | Warning, attention needed |
| `--color-error` | `#DC2626` | Error, critical |
| `--color-info` | `#2563EB` | Information |
| `--color-success-bg` | `#F0FDF4` | Success background |
| `--color-warning-bg` | `#FFFBEB` | Warning background |
| `--color-error-bg` | `#FEF2F2` | Error background |
| `--color-info-bg` | `#EFF6FF` | Info background |

**Domain colors (for Life Graph visualization):**

| Domain | Hex |
|---|---|
| Health | `#16A34A` |
| Career | `#2563EB` |
| Learning | `#7C3AED` |
| Relationships | `#EC4899` |
| Finance | `#D97706` |
| Creativity | `#F97316` |
| Home | `#84CC16` |
| Spirituality | `#06B6D4` |
| Adventure | `#E11D48` |

### 2.2 Typography

**Font stack:**
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

**Type scale:**

| Token | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `--text-xs` | 0.75rem (12px) | 1.5 | 400 | Small labels, metadata |
| `--text-sm` | 0.875rem (14px) | 1.5 | 400 | Body text, descriptions |
| `--text-base` | 1rem (16px) | 1.5 | 400 | Default body text |
| `--text-lg` | 1.125rem (18px) | 1.5 | 500 | Large body, subtitles |
| `--text-xl` | 1.25rem (20px) | 1.4 | 600 | Section headings |
| `--text-2xl` | 1.5rem (24px) | 1.3 | 700 | Page headings |
| `--text-3xl` | 1.875rem (30px) | 1.2 | 700 | Major headings |
| `--text-4xl` | 2.25rem (36px) | 1.1 | 800 | Hero/display |

### 2.3 Spacing

```css
--space-1: 0.25rem (4px)
--space-2: 0.5rem (8px)
--space-3: 0.75rem (12px)
--space-4: 1rem (16px)
--space-5: 1.25rem (20px)
--space-6: 1.5rem (24px)
--space-8: 2rem (32px)
--space-10: 2.5rem (40px)
--space-12: 3rem (48px)
--space-16: 4rem (64px)
--space-20: 5rem (80px)
--space-24: 6rem (96px)
```

### 2.4 Border Radius

```css
--radius-none: 0px
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-full: 9999px
```

**Neobrutalism approach:** Use `--radius-sm` for cards (sharp, bold look) with thick borders (`--border-width-default: 2px`).

### 2.5 Shadows

```css
--shadow-sm: 3px 3px 0px 0px rgba(0,0,0,1);
--shadow-md: 5px 5px 0px 0px rgba(0,0,0,1);
--shadow-lg: 8px 8px 0px 0px rgba(0,0,0,1);
--shadow-xl: 10px 10px 0px 0px rgba(0,0,0,1);

/* Neobrutalism signature: hard shadows, no blur */
```

### 2.6 Borders

```css
--border-width-default: 2px;
--border-width-thick: 3px;
--border-style: solid;
--border-color: var(--color-border);

/* All interactive elements have bold borders */
```

---

## 3. Component Styling Principles

### 3.1 Card Pattern (Neobrutalism)

```
┌─────────────────────────────────────┐
│  Card Title                    [>]  │  ← bold border (2px)
│─────────────────────────────────────│  ← hard shadow (3px 3px 0)
│  Content area with adequate padding │  ← clean spacing
│                                     │
│  [Button] [Button]                  │  ← thick borders
└─────────────────────────────────────┘
```

### 3.2 Button Styles

| Variant | Style |
|---|---|
| **Primary** | Accent background, white text, 2px border, shadow |
| **Secondary** | White background, dark text, 2px border, shadow |
| **Ghost** | No background, appears on hover |
| **Danger** | Error background, white text |
| **Icon** | Square, same height as width, icon-only |

### 3.3 Input Styles

```
┌─────────────────────────────────────┐
│ Label                                │
│ ┌─────────────────────────────────┐ │
│ │ Input value                    │ │  ← 2px border, rounded
│ └─────────────────────────────────┘ │
│ Helper text                          │
└─────────────────────────────────────┘
```

### 3.4 AI Suggestion Card

Distinct visual style to differentiate AI-generated content:

```
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐  ← dashed border (AI-specific)
│ ✨ AI Suggestion                     │  ← sparkle icon
│                                     │
│ Content with reasoning              │
│                                     │
│ [Accept] [Modify] [Dismiss]         │  ← explicit actions
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
```

---

## 4. Motion & Animation

### 4.1 Principles

- **Subtle** — animations serve purpose, never distract
- **Fast** — all animations < 300ms
- **Contextual** — animate to explain state changes
- **Accessible** — respect `prefers-reduced-motion`

### 4.2 Timing

```css
--duration-fast: 100ms;
--duration-normal: 200ms;
--duration-slow: 300ms;

--easing-default: cubic-bezier(0.4, 0, 0.2, 1);
--easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 4.3 Animation Types

| Type | Duration | Easing | Usage |
|---|---|---|---|
| **Fade in** | 200ms | Default | Content appearing |
| **Slide up** | 250ms | Spring | Modals, panels |
| **Scale** | 150ms | Spring | Cards, buttons (hover) |
| **Stagger** | 50ms/item | Default | List appearances |
| **Skeleton** | 1.5s loop | Linear | Loading states |

---

## 5. Iconography

- **Library:** Lucide (consistent with shadcn/ui)
- **Style:** Outline, 1.5px stroke, 24x24 default
- **Color:** Inherits text color unless specified
- **Animation:** Icons may animate on state change (check → spin, etc.)

---

## 6. Dark Mode

- **Toggleable** in settings
- **Follow system** by default
- **Smooth transition** between modes (300ms)
- **AI-generated content** uses different shade mapping for readability

---

## 7. Responsive Design

| Method | Implementation |
|---|---|
| **Container queries** | Component-level responsiveness |
| **Media queries** | Layout-level breakpoints |
| **Fluid typography** | `clamp()` for font sizes |
| **Flex/Grid** | Modern CSS layout |

---

## 8. Related Documents

- [UI_SYSTEM.md](./UI_SYSTEM.md) — UI architecture and screens
- [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) — Component catalog
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Frontend architecture
