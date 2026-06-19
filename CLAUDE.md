# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Headless Ecommerce Storefront built with:

| Layer            | Technology                              |
| ---------------- | --------------------------------------- |
| Framework        | Next.js (latest stable) — App Router    |
| Language         | TypeScript (Strict Mode)                |
| Styling          | Tailwind CSS (latest stable)            |
| UI Components     | Shadcn/UI (latest stable)               |
| Server State      | React Query (latest stable)             |
| Client State      | Zustand (latest stable)                 |
| Animation        | Framer Motion                           |
| CMS              | Strapi                                   |

## Commands

| Task            | Command          |
| --------------- | ---------------- |
| Install deps    | `npm install`    |
| Dev server      | `npm run dev`    |
| Production build| `npm run build`  |
| Start (prod)    | `npm run start`  |
| Lint            | `npm run lint`   |
| Type-check      | `npm run typecheck` |

Environment variables live in `.env.local` — see [.env.example](.env.example).
Access them through the typed `env` object in [src/config/env.ts](src/config/env.ts),
never `process.env` directly.

## Architecture

### Hybrid CMS Architecture

| Storefront Owns                  | CMS Owns                  |
| -------------------------------- | ------------------------- |
| Page Layout                      | Marketing Content         |
| Product Listing (PLP)            | Banner Content            |
| Product Detail (PDP)             | Campaign Content          |
| Search / Filter                  | Landing Pages             |
| Cart / Checkout                  | SEO Content               |
| Customer Account / Wishlist      | Blog Content              |
| Business Logic & Commerce Flows  | FAQ & Rich Text Content   |

**Rules**

- Storefront is the source of truth.
- CMS enhances storefront experiences.
- CMS must **never** control ecommerce business logic.

## Project Structure

```
src/
├── app/
│   ├── (storefront)/
│   ├── p/
│   │   └── [slug]/
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   └── not-found.tsx
│
├── features/
│   ├── home/
│   ├── product-list/
│   ├── product-detail/
│   ├── cart/
│   ├── checkout/
│   ├── account/
│   ├── wishlist/
│   └── search/
│
├── cms/
│   ├── renderer/
│   ├── services/
│   ├── transformers/
│   ├── blocks/
│   └── registry/
│
├── components/
│   ├── layout/
│   ├── shared/
│   └── ui/
│
├── hooks/
├── providers/
├── services/
├── store/
├── types/
├── lib/
├── config/
└── assets/
```

## Feature Rules

**One Feature = One Business Domain**

```
✅ Good                      ❌ Bad
features/                    features/
├── home                     ├── hero-banner
├── product-list             ├── promotion-banner
├── product-detail           └── faq-banner
├── cart
├── checkout
└── account
```

- Business domains are features.
- CMS blocks are **not** features.
- Each feature owns its own: `components`, `hooks`, `services`, `types`, `utils`.

## CMS Rules

Treat Strapi as an **external service** — never expose raw CMS responses.

```ts
// ❌ Bad
data.attributes.hero.data.attributes.title

// ✅ Good
hero.title
```

**Required flow** — always transform CMS responses before rendering:

```
Strapi → cms.service.ts → cms.transformer.ts → UI Components
```

### CMS Slot Rules

CMS content can only be injected into predefined slots:

| Page                | Slots                                |
| ------------------- | ------------------------------------ |
| Home                | `home-top`, `home-middle`, `home-bottom` |
| Product List (PLP)  | `plp-top`, `plp-bottom`              |
| Product Detail (PDP)| `pdp-top`, `pdp-content`, `pdp-bottom` |
| Cart                | `cart-top`, `cart-bottom`            |
| Checkout            | `checkout-top`, `checkout-bottom`    |
| Account             | `account-top`, `account-bottom`      |

- Storefront owns layouts; CMS fills slots.
- Never fetch CMS directly inside pages — always use `CmsSlot`.

### Landing Page Rules

Landing pages are **fully CMS-controlled** under the route `/p/[slug]`
(e.g. `/p/summer-sale`, `/p/black-friday`, `/p/new-arrivals`).

```
slug → Strapi → Dynamic Zone → BlockRenderer → Landing Page
```

### Dynamic Zone Rules

| ✅ Allowed (content blocks) | ❌ Forbidden (business logic) |
| --------------------------- | ----------------------------- |
| Hero Banner                 | Product List Logic            |
| Promotion Banner            | Search Logic                  |
| Brand Slider                | Filter Logic                  |
| FAQ                         | Cart Logic                    |
| Blog                        | Checkout Logic                |
| Rich Text                   | Customer Logic                |
| Gallery / Video Section     |                               |

Business logic belongs to the Storefront.

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

## Functional Programming Rules

- **Use:** Function Components, Pure Functions, Immutable Data, Composition.
- **Avoid:** Class Components, Mutable Patterns.

## Data Fetching Rules

Use React Query. **Never** call APIs inside components.

```
services/
├── product.service.ts
├── category.service.ts
├── cart.service.ts
├── order.service.ts
└── customer.service.ts
```

**Flow:** `Component → Hook → Service → API`

## State Management Rules

| Type         | Tool        |
| ------------ | ----------- |
| Server State | React Query |
| Client State | Zustand     |

- Avoid prop drilling.
- Keep stores isolated.
- Do not duplicate server state.

## UI Rules

- **Use:** Tailwind CSS, Shadcn/UI — reuse existing Shadcn components whenever possible.
- **Do not use:** MUI, Emotion, Styled Components, CSS Modules.
- **Button height:** clickable buttons must be **≥ 35px tall** (`min-h-[35px]`). The shared
  `Button` enforces this on its base; raw `<button>` controls (steppers, custom rows) must
  match — except deliberately compact **icon-only** buttons (`size="xs"|"icon-xs"|"icon-sm"`).

## Server Component Rules

Default to Server Components. Use `"use client"` only when required:

- `useState` / `useEffect`
- Zustand
- Browser APIs
- Event Handlers

## Responsive Rules

**Mobile First.** Support Mobile, Tablet, Desktop, Large Desktop.

- No horizontal scrolling
- No fixed widths
- Responsive spacing, typography, and images

## Branch / PLP / PDP / Wishlist Rules

### Branch (store availability)

- The active branch lives in `branch.store` (Zustand, persisted; `selectedBranchId`).
  Resolve the effective branch as `selected ?? resolveDefaultBranch(branches)`;
  the default id is `BRANCH_IDS[0]` (exported from `branch.service`).
- Stock is **per branch**: products carry `branchStock: { branchId, inStock, quantity }[]`.
  Availability for purchase is the **selected branch's** entry — never the global flag alone.
- **Add-to-cart must respect the selected branch** everywhere: PLP quick-add, PDP, and
  wishlist rows all disable/block when the selected branch is out of stock for the item.
- The user switches branch **only via the header branch selector**. Components must not
  offer an inline "switch branch" action — at most they *suggest* (informational text)
  which other branches carry the item.
- If the selected branch is out: block add + show "Hết hàng tại chi nhánh"; suggest other
  in-stock branches (info only). If **all** branches are out: show "Tất cả chi nhánh đều
  hết mặt hàng này".
- Branch-derived UI depends on client state (persisted store), so gate it behind mount
  (`mounted` flag) — render the global-stock fallback on the server/first paint to avoid
  hydration mismatch.

### PLP (`/c/[slug]`)

- Category-scoped product list. **Data-driven**: each vertical declares its facets in
  `VERTICAL_FACETS` (`product.service`); the UI renders facets by `facet.type`
  (`checkbox` / `swatch` / `range`) — never hard-code a specific facet like "color".
- **URL searchParams are the single source of truth** for filter/sort/page (parse via
  `parseProductParams`; reserved keys `q/sort/page/min/max`, everything else = a facet).
  Changing a filter pushes a soft navigation and smooth-scrolls to top.
- Server Component page + `loading.tsx` skeleton. CMS fills `plp-top` / `plp-bottom`
  via `<CmsSlot>` only.

### PDP (`/product/[slug]`)

- Product detail lives at **`/product/[slug]`**. Do NOT use `/p/[slug]` — that route is
  CMS landing pages. Product card / wishlist links point to `/product/...`.
- Variant options render by `displayType` (`swatch` / `pill` / `dropdown`); out-of-stock
  option values are disabled. Default selection picks the first **in-stock** value.
- On variant switch, **clamp quantity** to the new variant's stock; clamp again on add.
  The quantity limit must be visible (warning when the max is hit).
- Add-to-cart is gated by selected-branch availability (see Branch rules). Out-of-stock
  shows a "Thông báo khi có hàng" flow: if the customer has 2 contacts (email + phone)
  show a modal to choose; with exactly 1, register directly; with 0, prompt for one.
- Gallery handles many images (arrows + counter + scrollable thumbnails). Missing image →
  placeholder, never a broken `next/image`.
- SEO is required: `generateMetadata` (title/description/canonical/OpenGraph image) +
  `Product` JSON-LD (offers/availability/rating/images). CMS slots: `pdp-top` /
  `pdp-content` / `pdp-bottom`.

### Wishlist

- `wishlist.store` holds **multiple named lists** (`lists: { id, name, items }[]`, persisted,
  versioned/migrated). Full `ProductSummary` is stored so list pages render without refetch.
- Card heart opens `WishlistMenu` to pick/create the target list. Header badge = distinct
  saved products across all lists.
- `/wishlist` = overview of lists (create / delete); `/wishlist/[id]` = that list's items
  rendered as a **list of rows** using the shared `components/shared/product-line-row`
  (reused by the cart): per-row quantity stepper (clamped to the selected branch's stock),
  out-of-stock state, and remove — **no per-row add button**. A single "Thêm tất cả vào
  giỏ" opens a confirm dialog and adds every in-stock item at its chosen quantity;
  out-of-stock items (at the selected branch) are **force-removed from the list** in the
  same action (they can never reach the cart).
- Deleting a list (overview card or detail page) must go through `components/shared/
  confirm-dialog` ("Bạn có thật sự muốn xóa danh sách … không?"). Reuse `ConfirmDialog`
  for any destructive confirm.

## Code Generation Rules

When generating code:

- Follow Feature-Based + Hybrid CMS Architecture.
- One Feature = One Business Domain.
- Storefront owns layouts; CMS injects content through slots.
- Landing pages may be CMS-driven.
- Use TypeScript Strict Mode, React Query, Zustand, Tailwind CSS, Shadcn/UI.
- Prefer Server Components.
- Create reusable components, hooks, and services.
- Generate production-ready code.
