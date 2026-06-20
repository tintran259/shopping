# CMS Rules

> Binding detail for the CMS / Strapi integration. Read this before touching anything
> under `src/cms/`, CMS slots, landing pages, or dynamic-zone blocks.
> Core principle lives in [CLAUDE.md](../../CLAUDE.md): **storefront is the source of
> truth; CMS only enhances and must never control ecommerce business logic.**

## Hybrid CMS Architecture

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

## CMS Slot Rules

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

## Landing Page Rules

Landing pages are **fully CMS-controlled** under the route `/p/[slug]`
(e.g. `/p/summer-sale`, `/p/black-friday`, `/p/new-arrivals`).

```
slug → Strapi → Dynamic Zone → BlockRenderer → Landing Page
```

## Dynamic Zone Rules

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
