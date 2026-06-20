# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Feature Rule Docs (read first)

Detailed, binding rules live in `docs/rules/`. **Before working in any area below, read the
matching doc** — it extends this file with rules you must follow.

| Area | Doc |
| ---- | --- |
| Product: PLP (`/c/[slug]`), PDP (`/product/[slug]`), Branch availability, Wishlist | [docs/rules/product.md](docs/rules/product.md) |
| CMS: Strapi integration, slots, landing pages, dynamic-zone blocks, transformers | [docs/rules/cms.md](docs/rules/cms.md) |
| UI: component structure, styling, button height, responsiveness | [docs/rules/ui.md](docs/rules/ui.md) |

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

**Hybrid CMS** — the storefront owns all layout and commerce logic; the CMS only injects
marketing content into predefined slots.

- Storefront is the source of truth.
- CMS enhances storefront experiences.
- CMS must **never** control ecommerce business logic.

Full ownership matrix, slot list, landing-page and dynamic-zone rules: [docs/rules/cms.md](docs/rules/cms.md).

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

## Server Component Rules

Default to Server Components. Use `"use client"` only when required:

- `useState` / `useEffect`
- Zustand
- Browser APIs
- Event Handlers

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
- For area-specific rules (product flows, CMS, UI), follow the matching doc in `docs/rules/`.
