# Cart / Checkout / Order / Inventory Rules

> Binding detail for the buy flow end-to-end: cart → checkout → order → inventory →
> tracking → cancel. Read this before touching `features/checkout`, `features/orders`,
> `features/account`, `order.service`, `cart.service`, `use-cart`, or the BE
> `orders` / `cart` / `branches` / `vouchers` modules.
>
> **Golden rule:** the BE is the source of truth for money and stock. The FE computes
> totals/availability for UX only; the BE **recomputes** everything at order time.

## Cart (precursor to checkout)

- **One API: `useCart()`** (`src/hooks/use-cart.ts`), hybrid like the wishlist: guests use
  `cart.store` (local), logged-in users use the BE cart via React Query (`["cart"]`,
  optimistic), merged into the account once on login (module-level `mergedTokens` guard so
  the many mounted card instances don't fan out into repeated merges/refetches).
- Every line has a real **`variantId`** (the BE cart is keyed by variant). PLP quick-add /
  wishlist use the product's `defaultVariantId`; PDP + the variant picker use the chosen
  variant.
- Add-to-cart is capped at **branch stock − already-in-cart** (proactive), with the BE
  400 + a toast as the final guard. See product.md for the per-surface UX.
- **Mutations reconcile from their own response — no follow-up GET.** Every BE cart
  mutation (`POST/PATCH/DELETE /cart…`) returns the recomputed cart, so `cart.service`
  functions return `CartLine[]` and `use-cart` writes them straight into the `["cart"]`
  cache via `setLines` (instead of `invalidateQueries` → refetch). On error it falls back
  to `invalidate()` (the optimistic guess may be wrong → pull server truth).
- **Quantity writes are debounced per line** (`qtyTimers`, 400 ms): holding the +/-
  stepper updates the UI optimistically every click but sends only the final quantity
  (one PATCH). A stale response is ignored if a newer write for that line is still pending
  (`qtyTimers.has(id)`).
- **Cart page verifies LIVE stock**: it refetches the listed products (`["cart-stock", …]`,
  `placeholderData: keepPreviousData`) and reads each variant's fresh per-branch
  availability. Lines out at the branch show "Hết hàng" (remove); lines whose qty
  **exceeds** live stock show "Chỉ còn N" + a "Cập nhật số lượng" button that clamps them.
  Checkout is **blocked** until no line is OOS/over-limit (`canCheckout = all lines OK`).
- **Loading gate**: the cart page holds its skeleton until *both* the cart lines and the
  live-stock query have settled (`!ready || !stockReady`). Without this the stale snapshot
  briefly drives the OOS/over-limit banners before fresh stock lands (flash of false
  errors). `keepPreviousData` means only the first load shows the skeleton — add/remove
  re-verifies in the background without flashing.

## Checkout

- `features/checkout/checkout-page.tsx`. Reads cart `lines` (BE for auth, local for guest)
  + `checkout.store` (recipient/address/fulfillment/payment) + branch + voucher. A
  persistent **"← Giỏ hàng"** back link sits above the layout.
- `placeOrder(input, code?)` (`order.service`) picks the endpoint by auth:
  - **Logged in →** `POST /orders/checkout` (Bearer). Items come from the **server cart**;
    the FE body carries no items.
  - **Guest →** `POST /orders/guest-checkout` (`@Public`). Items (`variantId`, `quantity`)
    are sent in the body.
- `code` is a client-preset order code (used as the **bank-transfer QR memo**); the BE uses
  `dto.code ?? generated`. Payment id maps FE→BE: `cod→cod`, `bank→bank_transfer`,
  `momo→momo`.
- On success the FE: stores a rich `OrderRecord` (with images + variant labels) in
  `order.store` for the success page, clears cart + voucher, **invalidates `["products"]` +
  `["product"]`** (so stock updates immediately), and routes to `/order-success/[code]`.
- **`submitting` stays true through navigation** so the cleared cart never flashes the
  empty-cart guard. The order summary therefore suppresses all validation hints/errors
  while `submitting` — otherwise the emptied cart makes `canPlace` false and a false
  "thiếu thông tin" hint flashes under the button on the way to the success page.
- Errors surface the BE message verbatim (e.g. `Không đủ tồn kho: <name> (còn N)`).

## Order (BE `modules/orders`)

- Both checkout paths funnel into one private `placeOrder` core (recompute = source of
  truth): resolve line items → `assertAvailability` (friendly per-item message) →
  recompute subtotal/voucher/shipping → **transaction**: reserve stock, create order +
  items, create payment (pending), redeem voucher, mark cart converted.
- Order carries `customerId` (**null = guest**), `code`, `status`, `paymentStatus`,
  `stockStatus`, denormalized `paymentMethodCode`, `shippingAddress` snapshot, totals,
  and eager `items`.
- **Order items are denormalized snapshots** — an order must stay accurate even if the
  product/variant is later edited or deleted. Beyond `productName`/`unitPrice`/`quantity`,
  each item stores (captured at checkout, in `orders.service`):
  - **`imageUrl`** — `lineImageUrl()`: variant image, else the product's primary/first
    image. Requires `product.images` loaded (cart + `findVariantById` relations do).
  - **`variantTitle`** — `variantLabel()`: the variant's option values sorted by
    `sortOrder`, joined `" · "` (e.g. `500g`, `Đen · M`). **Empty for single-variant
    products** (no options → nothing meaningful; the SKU stays in the `sku` column).
  - Both are nullable; the `OrderItemImage` migration adds `image_url`.
- Endpoints: `POST /orders/checkout` (Bearer), `POST /orders/guest-checkout` (Public),
  `GET /orders/track?code=&phone=` (Public), `GET /orders` + `GET /orders/:id` (Bearer),
  `POST /orders/:id/cancel` (Bearer, customer), admin `PATCH /orders/:id/status` +
  `POST /orders/:id/confirm-payment`.

## Order detail (FE `features/orders/components/order-detail`)

Shared by the account history, guest tracking, and the success page. `order.service`
maps the BE order → `OrderRecord`; each item shows: **image + quantity badge**, name,
**variant label** (`item.detail` ← `variantTitle`), and **`đơn giá × số lượng`** plus the
line total. The same layout is used in the checkout `OrderSummary`.

### Status display (fulfillment-aware)

- The BE has **one** `OrderStatus` enum (`pending → confirmed → processing → shipped →
  delivered / cancelled`) for both fulfillments; only the **wording** differs per app.
- **Pickup orders never pass through `shipped`.** The BO (shopping-dashboard) advances
  them `pending → confirmed → processing → delivered` and filters `shipped` out of its
  dropdown; for pickup, `processing` means "Đã đóng hàng xong" (packed, waiting at the
  branch) and `delivered` means the customer collected. This convention is shared
  across shopping-dashboard (`orders/lib/labels.ts`) and the storefront — change both
  together.
- `orderStatusLabel(status, fulfillment)` (`order.service`) is the storefront mapping:
  - **delivery**: `processing` = "Đang chuẩn bị hàng", `shipped` = "Đang giao",
    `delivered` = "Đã giao".
  - **pickup**: `processing` (and stray `shipped`) = "Đã đóng hàng — sẵn sàng nhận",
    `delivered` = "Đã nhận hàng".
- `OrderRecord` carries both `status` (the worded label, display only) and
  **`statusCode`** (raw BE code). **Any logic — done/in-progress badges, filters —
  must compare `statusCode`, never the label** (labels vary by fulfillment).

## Inventory: reserve → commit → release

Stock has two counters: **`quantity`** (physical on hand) + **`reserved`** (held by
unfulfilled orders). **`available = quantity − reserved`** — this is what all display and
validation use (catalog serializer `availableOf`, cart `assertStock`). Every op locks the
row (pessimistic_write) and re-syncs `InventoryStatus` to `quantity`.

Each order tracks where its stock sits via **`order.stockStatus`** (idempotency guard):

| Event | Inventory op | stockStatus |
| --- | --- | --- |
| Place order | `reserve` (`reserved += qty`, quantity untouched; rejects oversell vs `available`) | `reserved` |
| Payment captured (bank confirm) / COD delivered | `commit` (`quantity −= qty`, `reserved −= qty`) | `committed` |
| Cancel while reserved | `release` (`reserved −= qty`) | `released` |
| Cancel after committed | `restock` (`quantity += qty`) | `released` |

- Wired in `orders.service`: `confirmPayment` + `updateStatus(DELIVERED)` → `commitStock`;
  `updateStatus(CANCELLED)` / `cancel()` / `cancelForUser()` → `cancelStock`. All
  idempotent (guarded by `stockStatus`).
- **Auto-release stale holds**: `orders.cron.ts` (@nestjs/schedule, every 5 min) cancels
  **prepaid** orders left unpaid > 30 min (`findStaleUnpaid`, **COD excluded**) → releases
  their reservation. Keeps unpaid bank-transfer orders from locking stock forever.

## Cancel (customer-initiated)

- **BE**: `POST /orders/:id/cancel` (Bearer) → `cancelForUser(customerId, id)`:
  - **Ownership** — `findOneForUser` (403 if not the customer's order).
  - **Status guard** — only `PENDING` / `CONFIRMED` (`CANCELLABLE` set) may be cancelled;
    already-`CANCELLED` is a no-op (idempotent); anything shipped/processing/delivered
    throws `BadRequestException` with a Vietnamese message.
  - Then sets `CANCELLED` and runs `cancelStock` (release if reserved, restock if
    committed) — stock is returned.
- **FE**: `order.service.cancelOrder(token, orderUuid)` (throws the BE message on failure).
  `OrderRecord` carries `uuid` (BE order id — needed since the FE `id` is the human `code`)
  and `cancellable` (computed from status ∈ {pending, confirmed}).
- **UI**: the account orders page passes `onCancel` to `OrderDetail`, which shows a "Hủy đơn
  hàng" button only when `cancellable`. Confirm via `ConfirmDialog`; the mutation toasts
  and invalidates `["my-orders"]` + `["products"]` + `["product"]` (stock returned). Guest
  tracking / success pages reuse `OrderDetail` but pass no `onCancel` → no button.

## Tracking + history

- **Guest**: `/track-order` → `GET /orders/track?code=&phone=` (Public). Cross-device (real
  BE lookup, not device-local).
- **Account**: `/account/orders` → `GET /orders` (Bearer), newest first; each card expands
  to the full `OrderDetail`. Guest orders (customerId null) do **not** appear here — there's
  no "claim guest order on login" flow yet.
- `order.service` maps the BE order → `OrderRecord`: status → VI label, `paymentMethodCode`
  → payment label, shippingAddress snapshot → address string.

## Voucher

### Architecture

```
FE (client-side)          BE (server-side)
─────────────────         ──────────────────────────────
validateVoucher()    →    POST /vouchers/check
  • expiry                  • same checks + usage limits
  • minSubtotal             • perCustomerLimit (DB query)
  • products (slugs)        • usageLimit (usedCount)
  • branches (id)           • customerScope: GUESTS/USERS/SPECIFIC
  • requiresAuth            • fail-closed on every dimension
  • guestsOnly
```

The FE check is **display-only** (enable/disable button, live hints). The BE check is the
authoritative gate that also enforces usage limits (counter in DB). Never skip the BE call
just because FE already validated.

### Key invariant: fail-closed on both sides

Both `validateVoucher` (FE) and `evaluate` (BE) are **fail-closed**:

| Condition | FE ctx missing | BE ctx missing |
|---|---|---|
| `applicableProducts` | → `ok: false` ("Giỏ hàng không có sản phẩm…") | → 400 |
| `applicableBranches` | → `ok: false` ("Vui lòng chọn chi nhánh…") | → 400 |
| `requiresAuth` | → `ok: false` | → 400 |

If you relax either side to fail-open, the button will be enabled but the apply call will
fail — users see a confusing "Mã không thể áp dụng" toast with no explanation.

### Product scope — slugs, not IDs

The storefront uses **product slugs** (not UUIDs) for the product scope check, on both FE
and BE. This is because logged-in users' `CartLine.id` is the cart-line UUID (from the
`cart_lines` table), not the product UUID, making UUID-based matching unreliable across
auth modes.

- **FE**: `validateVoucher` uses `ctx.cartSlugs` (from `lines.map(l => l.slug)`) vs
  `v.applicableProducts[].slug`.
- **BE** (`POST /vouchers/check`, `POST /orders/checkout`): receives `productSlugs: string[]`
  and compares against `voucher.products[].slug`.
- `CartLine.slug` is always correct for both guests (Zustand store) and logged-in users
  (BE cart API).

### Apply flow

```
User clicks "Áp dụng"
  └─ onApplyFromPopup(code)
       1. findVoucher(code, vouchers)           // already fetched, cached
       2. validateVoucher(v, subtotal, ctx)     // FE pre-check: immediate UX feedback
          ├─ fail → toast.info(reason), return
          └─ ok  →
       3. applyVoucherCode(code, subtotal, 0,   // POST /vouchers/check
                          customerId, branchId,
                          cartSlugs)
          ├─ 400 → toast.info(BE message)
          └─ 200 → voucherStore.apply(validated)
                   setShowPopup(false)
```

Manual input (`onApply`) follows the same path; the FE pre-check is skipped if the code is
not in the cached list (BE call always runs).

### VoucherContext (`src/services/voucher.service.ts`)

```ts
interface VoucherContext {
  cartSlugs?: string[];   // from lines.map(l => l.slug)
  branchId?: string;      // from useBranchStore(s => s.selectedBranchId)
  customerId?: string;    // from useAuthStore(s => s.user?.id)
}
```

All three callers must pass a fully-populated context: `VoucherSection`, `CartPage`
(`voucherCtx` for `discountFor`), and `VoucherList` (`validateVoucher` for button state).

### Voucher list fetch — single fetch, no double-call

Both `CartPage` and `VoucherSection` subscribe to the same React Query key:
`["vouchers", customerId ?? null]`. React Query deduplicates to one network request.

Both are gated on `isAuthReady` (`useAuthStore(s => s._hasHydrated)`): Zustand `persist`
hydrates async from localStorage; without this guard, a guest fetch fires before the
persisted token restores, and a second fetch fires after — causing a double-call and a
brief flash of wrong voucher scope.

### Auto-clear rules (VoucherSection)

Two separate `useEffect`s manage auto-clear on applied vouchers:

| Effect | Trigger | Condition | Action |
|---|---|---|---|
| **Scope-change** | `check?.ok`, `check?.reason` change | `ok = false` AND reason is NOT an auth reason | `clear()` + toast |
| **Auth-change** | `token` changes | Always when token changes | `clear()` + toast |

**Auth reasons** (scope-change effect skips these to prevent double toast on logout):
- `"Yêu cầu đăng nhập để sử dụng mã này"`
- `"Chỉ áp dụng cho khách vãng lai (không cần tài khoản)"`

**Non-auth reasons** (scope-change effect fires for these even on `requiresAuth` vouchers):
- Product removed from cart → `"Chỉ áp dụng cho sản phẩm: …"`
- Branch changed away → `"Chỉ áp dụng tại chi nhánh: …"`
- Subtotal dropped → `"Đơn tối thiểu …"`
- Voucher expired → `"Mã đã hết hạn"`

This means a `requiresAuth` voucher IS auto-cleared when its product/branch conditions
stop being met. It is NOT auto-cleared by the scope-change effect on logout (the auth-change
effect handles that, with a clearer message, to avoid two toasts firing).

### Nearest-voucher banner (CartPage)

The "Mua thêm X để nhận Y" banner only surfaces vouchers where **subtotal is the only
missing condition** — branch and product restrictions must already be satisfied:

```ts
availableVouchers.filter(v => {
  // customer scope
  if (v.guestsOnly && customerId) return false;
  if (v.requiresAuth && !customerId) return false;
  // branch already OK
  if (v.applicableBranches?.length && !v.applicableBranches.some(b => b.id === selectedBranchId)) return false;
  // products already in cart
  if (v.applicableProducts?.length && !v.applicableProducts.some(p => slugs.includes(p.slug))) return false;
  // only hint when subtotal is the gap
  return amountToQualify(v, subtotal) > 0;
})
```

### BE endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/vouchers/available` | Public | List active vouchers for the picker. Pass `?customerId=` to include `SPECIFIC`-scope vouchers assigned to that customer. |
| `POST` | `/vouchers/check` | Public | Validate code + compute discount. Verifies usage limits. Body: `{ code, subtotal, shippingFee?, branchId?, customerId?, productSlugs? }`. |
| `GET` | `/vouchers/validate` | Public | Legacy GET validate (kept for tooling). Prefer `POST /check`. |

### BE `evaluate()` check order

1. Voucher exists and `isActive`
2. `startsAt` / `endsAt` window
3. `usageLimit` (global counter)
4. `perCustomerLimit` (DB count per customer — requires `customerId`)
5. `minSubtotal`
6. `branches` restriction (fail-closed: no `branchId` sent → always reject)
7. `customerScope`: GUESTS / USERS / SPECIFIC
8. `products` restriction via **slugs** (fail-closed: empty `productSlugs` → reject)

### Redemption lifecycle

Vouchers are redeemed inside the order transaction (`orders.service → vouchers.service.redeem`):
- `usedCount` is incremented and a `voucher_redemptions` row is created atomically.
- On order cancellation, `unredeem` decrements `usedCount` and removes the row — freeing the
  slot back for `perCustomerLimit` and `usageLimit`.

### Gotchas

- **Cart line ID vs product ID**: For logged-in users, `CartLine.id` is the cart-line UUID
  (not the product UUID). Always use `CartLine.slug` for product scope checks.
- **`discountFor` needs full ctx**: The function calls `validateVoucher` internally. Calling
  it without ctx for a branch- or product-scoped voucher returns 0. Pass `voucherCtx`
  everywhere (CartPage, VoucherSection, checkout OrderSummary).
- **`requiresAuth` does not mean skip scope-change auto-clear**: product/branch removal still
  clears `requiresAuth` vouchers. Only auth-reason failures are skipped (handled by the
  auth-change effect).
- **Branch store has `_hasHydrated`**: same pattern as auth store. Use it if gating any
  branch-dependent query on hydration completion.

## Gotchas

- Never trust FE totals/stock — the BE recomputes. FE numbers are UX only.
- Cart mutations must consume the returned cart (`setLines`), not fire a follow-up GET; keep
  the quantity debounce so the stepper doesn't spam PATCH/GET.
- New order stock transitions must go through `commitStock`/`cancelStock` (keep them
  idempotent via `stockStatus`) — don't mutate inventory ad-hoc.
- Cancel is customer-facing but guarded: never bypass the ownership + status checks in
  `cancelForUser`.
- Schema lives across migrations: `StockReservation` (`reserved`, `stock_status`,
  `payment_method_code`; existing orders backfilled `committed`/`released`) and
  `OrderItemImage` (`image_url`). Old orders predating a column show null (no image; SKU as
  variant label) — new orders snapshot correctly.
- Bank-transfer payment is still **manual** (QR + admin `confirm-payment`); no gateway.
