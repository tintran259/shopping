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
