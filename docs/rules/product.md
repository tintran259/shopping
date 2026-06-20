# Branch / PLP / PDP / Wishlist Rules

> Binding detail for the product commerce flows. Read this before touching the branch
> selector, PLP (`/c/[slug]`), PDP (`/product/[slug]`), or wishlist features.

## Branch (store availability)

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

## PLP (`/c/[slug]`)

- Category-scoped product list. **Data-driven**: each vertical declares its facets in
  `VERTICAL_FACETS` (`product.service`); the UI renders facets by `facet.type`
  (`checkbox` / `swatch` / `range`) — never hard-code a specific facet like "color".
- **URL searchParams are the single source of truth** for filter/sort/page (parse via
  `parseProductParams`; reserved keys `q/sort/page/min/max`, everything else = a facet).
  Changing a filter pushes a soft navigation and smooth-scrolls to top.
- Server Component page + `loading.tsx` skeleton. CMS fills `plp-top` / `plp-bottom`
  via `<CmsSlot>` only.

## PDP (`/product/[slug]`)

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

## Wishlist

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
