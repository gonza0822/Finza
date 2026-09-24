# App Shell Page Overrides

> **PROJECT:** Finza
> **Page Type:** Signed-in chrome (sidebar / drawer)

> Rules in this file **override** the Master file.

---

## Layout

- **Desktop (`lg+`):** sticky left sidebar `w-64`, background `primary` (`#174643`), cream labels. Main column on sand; content `max-w-3xl`, padding so it never sits under the sidebar.
- **Mobile / tablet:** sticky top bar `h-14` (surface + `backdrop-blur`). Hamburger opens a left drawer (`w-72`) with the same teal panel. Overlay `primary/40` + blur. Drawer closes on link, overlay, Escape.
- **Do not** use a bottom tab bar in this phase (eight destinations).
- **Do not** use breadcrumbs (flat, one-level nav).
- Skip link: “Ir al contenido”, first focusable control in the shell.

## Navigation (spec §16)

Inicio, Movimientos, Cuentas, Tarjetas, Planificación, Metas, Proyección, Más.

- `next/link` only. `aria-current="page"` on the active item.
- Active: `bg-cream/15`, no scale. Hover: `bg-cream/10`, `transition-colors duration-200`.
- Logout lives in the sidebar footer (and on Más). Not a nav item.
- Optional “Descargar app” above logout. Hidden inside the Electron window. Cream outline on the teal sidebar.

## Motion

- Drawer: `x` + overlay `opacity` via Framer Motion + `AnimatePresence`.
- `useReducedMotion`: skip the slide (instant open/close).
- Do not animate the logo.

## Copy

- Empty screens speak to the user (vos). No phases, stack, or “próximamente técnico”.
- One `h1` per page, in the content column (not in the sidebar).

## Color on this chrome

- Sidebar: teal, cream text, peach blobs decorative only.
- Content cards: surface, primary/10 border.
- Focus on dark nav: cream ring.
