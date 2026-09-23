# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/finza/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Finza
**Generated:** 2026-09-11
**Category:** Personal finance / fintech

Brand tokens are **locked**. Do not replace them with generic zinc/blue palettes from the search CSV.

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#174643` | `--color-primary` |
| Secondary | `#2A9D8F` | `--color-teal-glow` |
| CTA | `#174643` | `--color-cta` |
| Accent (eyebrow only) | `#E08A4A` | `--color-warm` |
| Background | `#F4F1EA` | `--color-background` |
| Surface | `#FFFCF7` | `--color-surface` |
| Text | `#143330` | `--color-foreground` |
| Muted | `#3A524F` | `--color-muted` |

**Color Notes:** Locked to the Finza mark (`#174643`). Warm sand + peach glow. Primary CTA is teal, not orange or electric blue.

### Typography

- **Heading Font:** IBM Plex Sans
- **Body Font:** IBM Plex Sans
- **Mood:** cheerful but mature — human fintech, not a toy and not a vault
- Loaded via `next/font` in the root layout (not Caveat/Quicksand).

### Spacing Variables

| Token | Value | Usage |
|------|-----|----|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|------|-----|----|
| `--shadow-sm` | `0 1px 2px rgba(23,70,67,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(23,70,67,0.08)` | Cards, buttons |
| `--shadow-lg` | `0 16px 40px rgba(23,70,67,0.12)` | Drawers, elevated panels |

---

## Component Specs

### Buttons

Primary: teal background, cream text, `rounded-2xl`, `cursor-pointer`, hover via color (not layout-shifting scale). Focus: visible teal ring.

### Cards

Surface on sand, `rounded-3xl`, `border-primary/10`. `cursor-pointer` **only** if the card is clickable.

### Navigation

Lucide icons, 24×24 viewBox, consistent `size-5` in nav. Active state via background/color, not scale. Skip link on app chrome.

---

## Style Guidelines

**Style:** Warm sand app chrome + deep teal sidebar (same as the login brand column). Light glass only on the mobile top bar (`backdrop-blur`).

**Key Effects:** `opacity` and `transform` motion (Framer Motion). Honor `prefers-reduced-motion`. Do not animate the logo.

### Page Pattern

Signed-in app: persistent nav (sidebar desktop / drawer mobile) + one `h1` in the content column.

---

## Anti-Patterns (Do NOT Use)

- ❌ Generic zinc/blue palettes, electric CTA blue, or OLED-only dark app
- ❌ Emojis as icons — Lucide only
- ❌ Missing `cursor-pointer` on clickable elements
- ❌ Layout-shifting hovers (scale on the whole row)
- ❌ Low contrast text — 4.5:1 minimum
- ❌ Instant state changes — transitions 150–300ms
- ❌ Invisible focus states
- ❌ Nav overlapping content without padding compensation

---

## Pre-Delivery Checklist

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from Lucide
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
