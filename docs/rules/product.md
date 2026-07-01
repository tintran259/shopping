# Branch / PLP / PDP Rules

> Binding detail for the product browsing flows. Read this before touching the branch
> selector, PLP (`/c/[slug]`), or PDP (`/product/[slug]`).
>
> Related: **wishlist** → [wishlist.md](wishlist.md); **cart / checkout / order /
> inventory** → [order.md](order.md).

## Branch (store availability)

- Branches come from the BE (`getBranches()` → `GET /branches`). The active branch lives in
  `branch.store` (Zustand, persisted; `selectedBranchId`). Resolve the effective branch as
  `selectedBranchId ?? resolveDefaultBranch(branches)` (`resolveDefaultBranch` from
  `branch.service`) — there is no hardcoded branch list.
- The persisted id is validated against the fetched branches; a stale/unknown id self-heals
  to the default (`BranchSelector`). Only forward a **real UUID** as `branchId` to the BE.
- Stock is **per branch**: `branchStock: { branchId, inStock, quantity }[]`. `quantity` is
  the **sellable** amount (BE `available = quantity − reserved`; see order.md). Availability
  for purchase is the **selected branch's** entry — never the global flag alone. The PDP also
  exposes **per-variant** `branchStock`.
- **Add-to-cart must respect the selected branch** everywhere: PLP quick-add, PDP, and
  wishlist all block/disable when the selected branch is out of stock for the item, and cap
  quantity at **branch stock − already-in-cart**.
- The user switches branch **only via the header branch selector** (which pushes `?branch=`
  and updates the store). Components must not offer an inline "switch branch" action — at
  most they *suggest* (informational text) which other branches carry the item.
- If the selected branch is out: block add + show "Hết hàng tại chi nhánh"; suggest other
  in-stock branches (info only). If **all** branches are out: "Tất cả chi nhánh đều hết mặt
  hàng này".
- Branch-derived UI depends on client state (persisted store), so gate it behind mount
  (`mounted`) — render the global-stock fallback on first paint to avoid hydration mismatch.

## PLP (`/c/[slug]`)

- Category-scoped product list, **client-rendered** (`ProductListClient`) via React Query
  (`getProducts` → `GET /products`). The server wrapper (`ProductListPage`) fetches branches
  (SSR) and renders the CMS slots around it.
- **Data-driven facets**: the BE returns `facets` with the product list; the UI renders each
  by `facet.type` (`checkbox` / `swatch` / `range` / `rating`) — never hard-code a specific
  facet like "color".
- **URL searchParams are the single source of truth** for filter/sort/page/branch (parse via
  `parseProductParams`; reserved keys `q/sort/page/min/max/branch`, everything else = a
  facet). Changing a filter pushes a soft navigation.
- **Single, branch-scoped fetch**: `branchId` resolves synchronously from
  `?branch` / store / default branch (SSR prop), and the query is gated on `mounted`, so the
  list fetches **once** already scoped to the branch (no branchless→branch double fetch).
  Switching branch refetches for that branch (skeleton shows).
- **Quick-add** (`QuickAddButton`): simple product → add its `defaultVariantId` directly;
  **variant product (`optionPreview`) → open `VariantPickerModal`** (choose variant + qty).
  Disabled "Đã có tối đa trong giỏ" when branch stock − in-cart ≤ 0.
- CMS fills `plp-top` / `plp-bottom` via `<CmsSlot>` only.

## PDP (`/product/[slug]`)

- Product detail lives at **`/product/[slug]`**. Do NOT use `/p/[slug]` — that route is CMS
  landing pages. Product card / wishlist links point to `/product/...`.
- Variant options render by `displayType` (`swatch` / `pill` / `dropdown`); out-of-stock
  option values are disabled. Default selection picks the first **in-stock** value.
- **Quantity cap = the selected variant's stock at the selected branch − already-in-cart**
  (`remaining`). Show the live count ("Còn N sản phẩm tại {branch}"); when the cart already
  holds all available, show the disabled "Đã có tối đa trong giỏ" state. Per-variant branch
  stock comes from the BE `ProductDto.variants[].branchStock`.
- On variant switch, clamp quantity; clamp again on add. Reset quantity to 1 after adding.
- Add-to-cart is gated by selected-branch availability (see Branch rules). Out-of-stock shows
  a "Thông báo khi có hàng" flow: with 2 contacts (email + phone) show a modal to choose;
  with exactly 1, register directly; with 0, prompt for one.
- Gallery handles many images (arrows + counter + scrollable thumbnails). Missing image →
  placeholder, never a broken `next/image`.
- SEO is required: `generateMetadata` (title/description/canonical/OpenGraph image) +
  `Product` JSON-LD (offers/availability/rating/images). CMS slots: `pdp-top` /
  `pdp-content` / `pdp-bottom`.

## Shared

- Destructive confirms (delete list, clear cart, remove OOS, …) go through
  `components/shared/confirm-dialog`.
- Product rows in the cart + wishlist reuse `components/shared/product-line-row`.
