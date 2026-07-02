# Cart / Checkout / Order / Inventory Rules

> Binding detail for the buy flow end-to-end: cart → checkout → order → inventory →
> tracking → cancel. Read this before touching `features/checkout`, `features/orders`,
> `features/account`, `order.service`, `cart.service`, `use-cart`, or the BE
> `orders` / `cart` / `branches` modules.
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
