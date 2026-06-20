# UI Rules

> Binding detail for components, styling, and responsiveness. Read this before building
> or restyling any UI.

## Component Rules

Each component lives in its own folder:

```
ComponentName/
└── index.tsx
```

- One component = one responsibility.
- Prefer composition over inheritance.
- Build reusable UI; avoid large components.

**Size limits**

| Size        | Action          |
| ----------- | --------------- |
| < 100 lines | Ideal           |
| > 150 lines | Consider split  |
| > 250 lines | Must split      |

## UI Rules

- **Use:** Tailwind CSS, Shadcn/UI — reuse existing Shadcn components whenever possible.
- **Do not use:** MUI, Emotion, Styled Components, CSS Modules.
- **Button height:** clickable buttons must be **≥ 35px tall** (`min-h-[35px]`). The shared
  `Button` enforces this on its base; raw `<button>` controls (steppers, custom rows) must
  match — except deliberately compact **icon-only** buttons (`size="xs"|"icon-xs"|"icon-sm"`).

## Responsive Rules

**Mobile First.** Base styles target mobile; layer larger tiers with breakpoint prefixes.

### Breakpoints (Tailwind defaults)

| Tier         | Prefix   | Width    | Typical layout |
| ------------ | -------- | -------- | -------------- |
| Mobile       | (base)   | < 640px  | 1 column, full width |
| Tablet       | `md:`    | ≥ 768px  | 2 columns where there's room (e.g. content + summary) |
| Desktop      | `lg:`    | ≥ 1024px | full multi-column; inner forms may split to 2 cols |
| Large        | `xl:`    | ≥ 1280px | wider gutters / max-width caps |

> Don't skip the **tablet** tier: a page that jumps straight from 1-col (base) to
> multi-col at `lg:` leaves tablets rendering the mobile layout. Promote the main
> split at `md:` and, to avoid cramping inside a now-narrower column, keep **inner**
> form grids single-column until `lg:`.

### Checklist — every feature must pass

- [ ] Base layout = mobile, 1 column, **no fixed widths**.
- [ ] Multi-column layouts declared from `md:`/`lg:` — tablet is not left as mobile.
- [ ] **No horizontal scrolling at 360px.**
- [ ] Inner form/option grids don't cram inside a narrow column (gate at `lg:` when the page is `md:` two-col).
- [ ] Spacing, typography, and images scale across tiers (e.g. `py-8 sm:py-10`, `size-20 sm:size-24`).
- [ ] Sticky side panels stick from the tier they become a column (`md:sticky`, not `lg:` if the split is `md:`).
