# Design System — "Glass Ledger" Visual Language

This is the design direction for the requested **glass-effect, futuristic dashboard, delightful ("yummy"), well-animated** UI. It's a spec Claude Code should follow when building components — not just inspiration.

## Design pillars

1. **Glassmorphism, used with restraint.** Translucent, blurred panels floating over a dark, subtly animated gradient background — not every element blurred (that gets muddy and hurts readability of numbers, which is the whole point of a finance app).
2. **Numbers are the hero.** Typography and contrast are tuned so amounts are always the most legible thing on screen, even inside a glass panel.
3. **Motion communicates, it doesn't decorate.** Every animation either (a) shows a state change (money added, budget updated), (b) guides attention, or (c) gives feedback that an action succeeded. No motion "for vibes" that adds latency to daily use.
4. **Fast beats fancy.** Quick Add Expense is deliberately the least "fancy" flow in the app — instant, minimal-motion, keyboard-first — because that's the 10-second path used every day.

## Color system

Dark mode (default):
| Token | Value | Use |
|---|---|---|
| `--bg-base` | `#0A0E17` | app background, deep navy-black |
| `--bg-gradient` | radial gradient `#101828 → #0A0E17` | subtle ambient background, very slow animated drift |
| `--glass-surface` | `rgba(255,255,255,0.06)` | panel fill |
| `--glass-border` | `rgba(255,255,255,0.12)` | panel border, 1px |
| `--accent-primary` | `#6C7CFF` (electric indigo) | primary actions, active states |
| `--accent-success` | `#3DDC97` (mint) | income, under-budget, positive |
| `--accent-warning` | `#FFB648` (amber) | approaching budget limit |
| `--accent-danger` | `#FF5C7A` (coral red) | over-budget, destructive actions |
| `--text-primary` | `#F5F7FF` | numbers, headings |
| `--text-secondary` | `rgba(245,247,255,0.6)` | labels, captions |

Light mode: same token names, same roles, mapped to a flatter light palette (`--bg-base: #F4F5FA`, `--glass-surface: rgba(255,255,255,0.7)` with a subtle shadow instead of heavy blur — glass reads as "frosted card," not window-glass, in light mode).

## The "glass card" component

```
.glass-card {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(20px) saturate(140%);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.24);
}
```
- Used for: dashboard KPI tiles, chart containers, modals, Quick Add panel.
- Never nested more than one level deep (a glass card inside a glass card muddies contrast).
- Hover/focus state: border brightens to `rgba(255,255,255,0.24)` and the card lifts 2px with a soft shadow increase — cheap, GPU-friendly, no layout shift.

## Futuristic dashboard layout

- **Left rail**: icon-first collapsible nav, glass background, active item gets a glowing left-accent bar in `--accent-primary`.
- **Top strip**: current month selector + global Quick Add button + theme toggle.
- **Main grid**: 4 KPI glass tiles (Income / Expenses / Savings / Remaining) across the top, each with a big animated number and a tiny sparkline; below, a 2-column grid of chart cards (Spending by Category — donut, Daily Spending — bar, Budget vs Actual — horizontal bars with over-budget glow, Savings Trend — line with gradient fill).
- Subtle ambient background: a very slow (60s+ loop), low-opacity gradient/particle drift behind everything — never distracting, effectively static at a glance, alive on close inspection. This is the primary "futuristic/yummy" signature and costs nothing in usability since it never competes with foreground content.

## Animation spec (Framer Motion)

| Interaction | Animation | Duration |
|---|---|---|
| Page/route transition | Fade + 8px slide-up | 200ms, ease-out |
| KPI numbers on dashboard load/update | Count-up from previous value to new value | 500–700ms |
| Glass card enter (dashboard first load) | Staggered fade+scale-in, 60ms stagger per card | 300ms each |
| Chart draw-in | Bars grow from 0 / line path draws in | 500ms, ease-out, once per data change |
| Budget bar crossing into warning/danger zone | Color morph + brief pulse glow | 400ms |
| Button press | Scale to 0.97 | 100ms |
| Success toast (expense saved, backup complete) | Slide-in + check icon draw | 250ms in, auto-dismiss 2.5s |
| Modal open/close (incl. Quick Add) | Backdrop fade + panel scale 0.96→1 | **120ms** — intentionally the fastest animation in the app |
| Destructive confirm dialog | Slight shake if user tries to dismiss by clicking outside on a delete | 200ms |

Rule of thumb: anything in the **daily hot path** (Quick Add open/close/submit) stays under 150ms total. Anything **reviewed occasionally** (dashboard, reports) can be more expressive, up to ~700ms.

## Typography

- Numbers: tabular/monospaced figures (e.g., Inter or a similar variable font with `font-variant-numeric: tabular-nums`) so amounts don't jitter in width as they count up or update.
- Headings: same family, higher weight, generous letter-spacing for a "premium fintech" feel.
- Body/labels: same family, `--text-secondary` color, never smaller than 13px (readability for a non-technical family member per NFR-6).

## Accessibility guardrails (glass effects can hurt this — must be checked)

- Text inside glass panels must maintain **≥4.5:1 contrast** against the blurred backdrop at all times — test against both busiest and emptiest background states.
- `prefers-reduced-motion` is respected: all Framer Motion animations degrade to instant/opacity-only transitions when the OS setting is on.
- Backdrop-blur is disabled gracefully (falls back to solid `--glass-surface` at higher opacity) on any hardware/driver combination where it's not performant — never let the glass effect cause jank.
- Color is never the only signal for budget status — an icon/label always accompanies the warning/danger color.

## Component inventory (build these once, reuse everywhere)

`GlassCard`, `KpiTile`, `QuickAddModal`, `AmountInput` (currency-aware, big touch/click target), `CategoryPicker`, `DateField`, `Sparkline`, `DonutChart`, `BudgetBar`, `Toast`, `ConfirmDialog`, `EmptyState`, `SidebarNavItem`.
