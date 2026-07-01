# Wishlist Rules

> Binding detail for the wishlist flow (the heart button, the picker popup, and the
> wishlist pages). Read this before touching anything under `features/wishlist`,
> `WishlistMenu`, `WishlistPickerModal`, `use-wishlist`, or the BE `wishlist` module.

## Model: hybrid (guest local ↔ account BE) + variant-level

- **One API for the whole app: `useWishlist()`** (`src/hooks/use-wishlist.ts`). Components
  never touch the store or the service directly — they call the hook.
- **Guest** (no auth token): reads/writes the persisted Zustand store
  (`src/store/wishlist.store.ts`, localStorage key `wishlist`).
- **Logged in**: reads/writes the BE via React Query (`queryKey ["wishlist"]`), with
  optimistic toggles. Endpoints are all Bearer-auth.
- **On login**: the guest's lists are merged into the account **once per token**
  (`mergeGuestWishlist`), then the local store is reset. The merge is guarded by a
  module-level `mergedTokens` set so the many mounted hook instances (every product card)
  don't fan out into repeated merges/refetches.
- No auto "default" list — the user creates their own. Starting state is `[]`.

## Wishlist entries are VARIANT-level

- A saved entry can pin a specific variant. `WishlistItem` = `ProductSummary` +
  `variantId?` + `variantLabel?`.
- **Composite id**: `id = "productId:variantId"` for a variant entry; `id = productId`
  for a simple product. Use `baseProductId(id)` (exported from `wishlist.store`) to get
  the product id back. So `250g` and `500g` of the same product are **two entries**.
- The stored `price`, `thumbnail`, and `branchStock` are the **chosen variant's**, so the
  wishlist renders the right price/stock without a refetch.
- Heart is "filled" when **any** variant of the product is saved
  (`lists.some(l => l.items.some(i => baseProductId(i.id) === product.id))`).

## The heart / add popup (`WishlistMenu`)

- Simple product (no `optionPreview`) → the small **dropdown** to pick/create a list and
  toggle membership. Saves the product (no variant).
- Variant product (`product.optionPreview` present) → opens **`WishlistPickerModal`**
  (`components/shared/variant-picker-modal` sibling: `wishlist-picker-modal`). The popup =
  **choose variant → choose list(s) → save**. **No quantity** (a wishlist entry is always
  one item). List checkboxes reflect membership of the *currently selected* variant.
- The modal fetches the full product (`getProductBySlug`) to know the variants; it builds
  the `WishlistItem` with the variant's price/thumbnail/branchStock + `variantLabel`.

## BE (`shopping-api` `modules/wishlist`)

- Endpoints (all `@ApiBearerAuth`): `GET /wishlist`, `POST /wishlist` (create list),
  `PATCH /wishlist/:id` (rename), `DELETE /wishlist/:id` (delete list),
  `POST /wishlist/items` (add — **idempotent**, dedupes by productId+variantId),
  `DELETE /wishlist/items/:itemId`.
- `AddWishlistItemDto` requires `wishlistId` + `productId`, optional `variantId`.
- **Serializer is variant-aware**: `toWishlistDto` uses `ProductsService.detailsByIds`
  (full products incl. variants) and returns, per item, `{ id (itemId), variantId,
  variantLabel, product }` where `product` is a compact summary **adjusted to the variant**
  (price/thumbnail/branchStock). Items whose product no longer exists are dropped.
- Removal is by **server `itemId`**; the FE keeps a `listId → (composite item key →
  itemId)` map to translate.

## Wishlist pages

- `/wishlist` — the lists overview (cover collage + counts).
- `/wishlist/[id]` — the detail page. Rows show the **variant label** ("500g"), a quantity
  stepper, and remove. There is **no per-row add-to-cart button**; adding is done via the
  single **"Thêm tất cả vào giỏ"**.
- **Stock is verified against LIVE stock**, not the saved snapshot (which is stale for
  guests): the detail page refetches the listed products (`["wishlist-stock", …]`) and
  reads each variant's fresh `branchStock`. Availability + quantity caps use that.
- **"Thêm tất cả vào giỏ" is disabled when any item is out of stock**
  (`!anyAvailable || oosCount > 0`). An OOS banner + "Xóa sản phẩm hết hàng" lets the user
  clear them, which re-enables the button.
- Add-to-cart from the wishlist pins the saved variant (`item.variantId`) — no re-pick.
  Legacy entries saved product-level (variant product without a variantId) still show
  "Chọn phân loại" and are skipped by "add all".
- Quantity cap per row = **branch stock − already-in-cart** for that variant (same rule as
  PDP/PLP); OOS items are flagged and excluded from "add all".

## Gotchas

- Do not read `wishlist.store` directly in components — use `useWishlist()`.
- When adding fields to a wishlist item, remember it flows through: BE serializer →
  `wishlist.service` map (`toWishlistItem`) → store `WishlistItem` → hook → pages.
- The merge + all mutations must stay idempotent (BE dedupes; FE guards by token).
