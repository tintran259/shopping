# Luồng hiện có của Storefront

Tổng hợp các luồng đã triển khai (mock-first, chưa nối BE thật). Tham chiếu nhanh cho
dev. Rule chi tiết xem `docs/rules/*`.

## Bản đồ route

| Route | Mô tả |
| --- | --- |
| `/` | Trang chủ (CMS slots: home-top/bottom, announcement-bar) |
| `/c/[slug]` | PLP — danh sách sản phẩm theo danh mục |
| `/product/[slug]` | PDP — chi tiết sản phẩm |
| `/p/[slug]` | Landing page do CMS điều khiển (dynamic zone) |
| `/search` · `/api/search` | Tìm kiếm + gợi ý |
| `/cart` | Giỏ hàng |
| `/checkout` | Thanh toán |
| `/order-success/[id]` | Xác nhận đặt hàng |
| `/track-order` | Tra cứu đơn (mã đơn + SĐT) |
| `/wishlist` · `/wishlist/[id]` | Danh sách yêu thích (nhiều list) |
| `/login` · `/register` | Đăng nhập / đăng ký (cá nhân) |
| `/account` · `/account/profile` · `/account/addresses` | Tài khoản |

**Store (Zustand, persisted):** `cart` · `voucher` · `checkout` · `auth` · `address` ·
`order` · `branch` · `wishlist`.

---

## 1. Khám phá / Duyệt

- **Chi nhánh**: chọn ở header (`branch.store`) → scope tồn kho/giá/giao-nhận toàn site.
  Chỉ đổi chi nhánh qua header.
- **Tìm kiếm**: gõ ở header → gợi ý debounce qua `/api/search` (React Query); Enter → `/search`.
- **Điều hướng**: nav (CMS menu + cây danh mục BE) → PLP.

## 2. PLP — `/c/[slug]`

- **Lọc data-driven**: facet khai báo trong `VERTICAL_FACETS`; UI render theo `facet.type`
  (checkbox/swatch/range). **URL searchParams là nguồn sự thật** (q/sort/page/min/max + facet).
- Đổi filter → soft navigation + cuộn lên đầu mượt; có skeleton (`loading.tsx`); phân trang.
- **Quick-add**: thêm thẳng vào giỏ, **theo chi nhánh** — hết hàng tại chi nhánh đang chọn → nút disabled "Hết hàng tại chi nhánh".
- **Wishlist**: nhấn tim → chọn/ tạo danh sách.
- CMS slots: `plp-top` / `plp-bottom`.

## 3. PDP — `/product/[slug]`

- Gallery nhiều ảnh (mũi tên + counter + thumb cuộn); thiếu ảnh → placeholder.
- **Biến thể** render theo `displayType` (swatch/pill/dropdown); giá trị hết hàng bị mờ;
  mặc định chọn giá trị **còn hàng** đầu tiên; đổi biến thể → **clamp số lượng** theo tồn.
- **Tồn theo chi nhánh**: còn ở chi nhánh đang chọn → mua được; hết → chặn + gợi ý chi nhánh
  khác (info) hoặc "Tất cả chi nhánh đều hết"; `preorder` → đặt trước.
- **Hết hàng → "Thông báo khi có hàng"**: 1 liên hệ → đăng ký thẳng; 0 hoặc 2 → modal (2 = chọn email/SĐT, 0 = nhập).
- Thêm vào giỏ: lưu giá/branchStock/biến thể vào `cart.store`.
- **SEO**: `generateMetadata` (title/desc/canonical/OG) + JSON-LD `Product`. CMS slots: `pdp-top/content/bottom`.

## 4. Giỏ hàng — `/cart`

- Dòng sản phẩm (`ProductLineRow` dùng chung): stepper clamp theo tồn chi nhánh, xóa, "Còn {n}" khi ≤20.
- **Hết hàng tại chi nhánh đang chọn** → dòng unavailable + banner + nút "Xóa sản phẩm hết hàng" (ConfirmDialog); **chặn checkout** tới khi xử lý.
- **Voucher**: nhập mã / "Xem mã khả dụng"; validate (đơn tối thiểu, hết hạn, không tồn tại);
  `FREESHIP` để dành phí ship; **re-validate** khi giảm số lượng; tự bỏ giảm nếu hết điều kiện.
- **Tóm tắt**: Tạm tính → Giảm voucher → Tổng cộng; badge **"Đã tiết kiệm"** (giá gốc + voucher) tách khỏi phép tính.
- "Xóa tất cả" (ConfirmDialog). → "Tiến hành thanh toán".

## 5. Thanh toán — `/checkout`

Cho cả **guest** (không bắt đăng nhập) lẫn user đã đăng nhập.

1. **Guard**: giỏ trống / toàn hết hàng → "Về giỏ hàng"; còn dòng hết hàng → banner chặn đặt.
2. **Phương thức nhận hàng**: Giao tận nơi **hoặc** Nhận tại chi nhánh (0đ, hiện info chi nhánh).
3. **Thông tin nhận hàng**:
   - User có địa chỉ lưu → **danh sách chọn nhanh** (tự chọn mặc định) + "Giao đến địa chỉ khác".
   - Nhập tay → Tỉnh/Quận/Phường bằng **combobox tìm kiếm** (data thật từ API, fallback list + text).
4. **Phí ship**: cùng tỉnh rẻ hơn (khớp theo `provinceCode`); tiêu chuẩn/nhanh; pickup = 0.
5. **Hóa đơn VAT** (tùy chọn, prefill cho B2B): bật → bắt buộc tên cty + MST + email.
6. **Voucher**: kế thừa từ giỏ; giảm đơn + giảm phí ship (FREESHIP).
7. **Thanh toán**:
   - **COD** → đặt thẳng.
   - **Chuyển khoản** → bấm Đặt hàng → **modal QR VietQR** (STK/số tiền/nội dung = mã đơn, có nút copy) → **"Xác nhận đã thanh toán"** mới tạo đơn. "Để sau" → không tạo đơn.
   - **MoMo / Thẻ** → "Sắp có" (disabled, cần cổng/BE).
8. **Đặt hàng**: validate → tạo đơn (`order.store`) → **xóa giỏ + voucher** → `/order-success/[id]`.
   Lỗi đặt hàng → báo inline, giữ giỏ để thử lại. Chống double-submit.

## 6. Xác nhận & tra cứu đơn

- **`/order-success/[id]`**: route riêng, đọc đơn từ `order.store`; hiện chi tiết (mã, người nhận, sản phẩm, tổng, trạng thái).
  - **Guest** → **popup tạo tài khoản** (prefill tên/email/SĐT từ đơn, chỉ cần mật khẩu → tự đăng nhập).
  - Desktop refresh/mở link vẫn xem được; mã không có trên máy → "Không tìm thấy" + link tra cứu.
- **`/track-order`**: nhập mã đơn + SĐT → chi tiết đơn (đơn lưu device-local).

## 7. Wishlist — `/wishlist`

- Nhiều **danh sách đặt tên** (`wishlist.store`, lưu full `ProductSummary`).
- `/wishlist` = tổng quan (tạo/xóa list, ConfirmDialog); `/wishlist/[id]` = các dòng sản phẩm
  (`ProductLineRow`): chỉnh số lượng (theo tồn chi nhánh), xóa, **"Thêm tất cả vào giỏ"** (confirm; hàng hết tại chi nhánh bị **buộc xóa khỏi list**).

## 8. Tài khoản & xác thực

- **Mô hình**: B2C tự đăng ký (`/register`, chỉ cá nhân) + đăng nhập chung (`/login`) + **guest checkout**.
  **B2B không tự đăng ký** — cấp tài khoản từ BO, đăng nhập chung; `user.type==="business"` mở quyền sỉ (chưa nối giá).
- **Account (responsive)**:
  - Mobile: `/account` = **hub** (menu dọc Shopee-style) → mục mở **trang con full** + nút "← Tài khoản".
  - Desktop: `/account` → `/account/profile`; có **sidebar** cố định.
  - **Hồ sơ** (`/account/profile`): thông tin cá nhân (+ DN: công ty/MST), bảo mật (sắp có).
  - **Địa chỉ** (`/account/addresses`): **CRUD sổ địa chỉ**, đặt mặc định, modal thêm/sửa (combobox tìm kiếm).
  - **Đơn hàng**: "Sắp có".
- **Đăng xuất** → `logoutAndReset()` xóa **toàn bộ** store (auth/cart/voucher/checkout/wishlist/branch/order/address).

## 9. CMS / Theme (nền)

- Storefront sở hữu layout & commerce; CMS chỉ chèn nội dung qua **slot** (`<CmsSlot>`); **không** điều khiển business logic.
- Theme từ CMS → CSS vars `--theme-*` (gồm `selectBorder`, `btnPrimary*`, price/rating…); đổi là áp ngay.
- Landing `/p/[slug]` = dynamic zone → BlockRenderer. Lập lịch hiển thị (startAt/endAt) + client gating.

---

## Chưa làm (mock / để dành)
- **Mã ngân hàng** đang là constant `BANK_INFO` — nên đưa lên BO (single type "Cài đặt").
- **B2B giá sỉ / VAT theo role** — để dành tới khi yêu cầu (xem memory auth model).
- **Nối BE thật**: auth, đơn hàng, cổng thanh toán (MoMo/thẻ), đối soát chuyển khoản, đồng bộ giỏ/wishlist/địa chỉ theo user (hiện device-local).
- Test mới phủ logic service (Vitest); chưa có test component/flow (RTL).
