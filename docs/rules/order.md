# Cart / Checkout / Order / Inventory Rules

> Binding detail for the buy flow end-to-end: cart → checkout → order → inventory →
> tracking. Read this before touching `features/checkout`, `features/orders`,
> `order.service`, `cart.service`, or the BE `orders` / `cart` / `branches` modules.
>
> **Golden rule:** the BE is the source of truth for money and stock. The FE computes
> totals/availability for UX only; the BE **recomputes** everything at order time.

## Cart (precursor to checkout)

- **One API: `useCart()`** (`src/hooks/use-cart.ts`), hybrid like the wishlist: guests use
  `cart.store` (local), logged-in users use the BE cart via React Query (`["cart"]`,
  optimistic), merged into the account once on login.
- Every line has a real **`variantId`** (the BE cart is keyed by variant). PLP quick-add /
  wishlist use the product's `defaultVariantId`; PDP + the variant picker use the chosen
  variant.
- Add-to-cart is capped at **branch stock − already-in-cart** (proactive), with the BE
  400 + a toast as the final guard. See product.md for the per-surface UX.
- **Cart page verifies LIVE stock**: it refetches the listed products (`["cart-stock", …]`)
  and reads each variant's fresh per-branch availability. Lines out at the branch show
  "Hết hàng" (remove); lines whose qty **exceeds** live stock show "Chỉ còn N" + a "Cập nhật
  số lượng" button that clamps them. Checkout is **blocked** until no line is OOS/over-limit
  (`canCheckout = all lines OK`). This is the proactive layer before the BE `assertAvailability`
  at placeOrder.

## Checkout

- `features/checkout/checkout-page.tsx`. Reads cart `lines` (BE for auth, local for guest)
  + `checkout.store` (recipient/address/fulfillment/payment) + branch + voucher.
- `placeOrder(input, code?)` (`order.service`) picks the endpoint by auth:
  - **Logged in →** `POST /orders/checkout` (Bearer). Items come from the **server cart**;
    the FE body carries no items.
  - **Guest →** `POST /orders/guest-checkout` (`@Public`). Items (`variantId`, `quantity`)
    are sent in the body.
- `code` is a client-preset order code (used as the **bank-transfer QR memo**); the BE uses
  `dto.code ?? generated`. Payment id maps FE→BE: `cod→cod`, `bank→bank_transfer`,
  `momo→momo`.
- On success the FE: stores a rich `OrderRecord` (with images) in `order.store` for the
  success page, clears cart + voucher, **invalidates `["products"]` + `["product"]`** (so
  stock updates immediately), and routes to `/order-success/[code]`.
- Errors surface the BE message verbatim (e.g. `Không đủ tồn kho: <name> (còn N)`).

## Order (BE `modules/orders`)

- Both checkout paths funnel into one private `placeOrder` core (recompute = source of
  truth): resolve line items → `assertAvailability` (friendly per-item message) →
  recompute subtotal/voucher/shipping → **transaction**: reserve stock, create order +
  items, create payment (pending), redeem voucher, mark cart converted.
- Order carries `customerId` (**null = guest**), `code`, `status`, `paymentStatus`,
  `stockStatus`, denormalized `paymentMethodCode`, `shippingAddress` snapshot, totals,
  and eager `items`.
- Endpoints: `POST /orders/checkout` (Bearer), `POST /orders/guest-checkout` (Public),
  `GET /orders/track?code=&phone=` (Public), `GET /orders` + `GET /orders/:id` (Bearer),
  admin `PATCH /orders/:id/status` + `POST /orders/:id/confirm-payment`.

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
  `updateStatus(CANCELLED)` / `cancel()` → `cancelStock`. All idempotent (guarded by
  `stockStatus`).
- **Auto-release stale holds**: `orders.cron.ts` (@nestjs/schedule, every 5 min) cancels
  **prepaid** orders left unpaid > 30 min (`findStaleUnpaid`, **COD excluded**) → releases
  their reservation. Keeps unpaid bank-transfer orders from locking stock forever.

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
- New order stock transitions must go through `commitStock`/`cancelStock` (keep them
  idempotent via `stockStatus`) — don't mutate inventory ad-hoc.
- Schema lives in the `StockReservation` migration (`reserved`, `stock_status`,
  `payment_method_code`); existing orders were backfilled `committed`/`released`.
- Bank-transfer payment is still **manual** (QR + admin `confirm-payment`); no gateway.
