# Login Page Overrides

> **PROJECT:** Finza
> **Generated:** 2026-09-11
> **Page Type:** Authentication

> Rules in this file **override** the Master file.

---

## Layout

- **Desktop (lg+):** split 50/50. Left: deep teal (`#174643`) brand column with `public/brand/logo-finza.png`, wordmark copy. Right: warm sand form.
- **Mobile:** stacked. Logo + wordmark above the heading; no dark full-bleed panel.
- **Max form width:** `max-w-md`. Card `rounded-3xl` to echo the mark’s curves.

## Brand

- Mark path: `/brand/logo-finza.png` via `next/image` with explicit width/height.
- **Do not animate the logo** (LCP). Fade only the form card (`opacity` + `translateY`).
- Left panel middle: `AuthBrandCards` — pointer tilt + click/keyboard flip. No infinite spin. Honor `useReducedMotion`.
- Alt of the image: `Finza`. One `h1` per page (the greeting, not the brand title on the left).

## Color on this page

- Primary buttons: logo teal, cream text.
- Warm peach (`--color-warm`) only as eyebrow / decorative blobs, not as the main CTA.
- Focus rings: teal-glow, visible, never `outline-none` without a ring.

## Copy

- Cheerful and adult. No slang, no emojis as icons.
