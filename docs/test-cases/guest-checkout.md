# Test Cases — Guest User: Order → Checkout → Order Success

Phạm vi: khách **chưa đăng nhập** (guest), từ lúc thêm hàng vào giỏ → thanh toán → đặt
hàng thành công. Áp dụng cho `/cart`, `/checkout`, màn xác nhận đơn.

## Dữ liệu test (mock)

- **Chi nhánh**: `hcm-q1` (TP.HCM, mặc định), `hcm-q7` (TP.HCM), `hn-hk` (Hà Nội), `dn-hc` (Đà Nẵng).
- **Tồn kho theo chi nhánh**: sản phẩm có `branchStock[]`; còn/hết khác nhau theo chi nhánh; "Còn {n}" hiển thị khi tồn ≤ 20.
- **Voucher**: `DACSAN10` (−10%, tối đa 30K, đơn ≥200K) · `WELCOME15` (−15%, tối đa 50K, ≥100K) · `GIAM50K` (−50K, ≥300K) · `FREESHIP` (giảm phí ship tối đa 30K, ≥150K).
- **Phí ship**: cùng tỉnh — tiêu chuẩn 18K / nhanh 35K; khác tỉnh — 30K / 55K; **Nhận tại chi nhánh = 0K**.
- **Thanh toán**: COD (mặc định), chuyển khoản, MoMo, thẻ.
- Guest = `auth.store.user === null` (không đăng nhập).

> Quy ước kết quả: **Tổng cộng = Tạm tính − giảm voucher đơn + phí ship − giảm voucher ship**, không bao giờ âm. "Tiết kiệm" là badge thông tin, **không** trừ vào tổng.

---

## 1. Giỏ hàng (Order)

### TC-G-01 — Thêm sản phẩm còn hàng từ PLP (quick-add)
- **Tiền đề**: chi nhánh đang chọn còn hàng sản phẩm A.
- **Bước**: ở `/c/[slug]`, bấm "Thêm vào giỏ" trên card A.
- **Kỳ vọng**: badge giỏ +1; nút đổi "Đã thêm ✓" tạm thời; dòng A xuất hiện trong `/cart`.

### TC-G-02 — Quick-add khi hết hàng tại chi nhánh đang chọn
- **Tiền đề**: A hết hàng ở chi nhánh đang chọn (còn ở chi nhánh khác).
- **Bước**: xem card A.
- **Kỳ vọng**: nút hiển thị "Hết hàng tại chi nhánh", **disabled**; không thêm được vào giỏ.

### TC-G-03 — Thêm từ PDP có biến thể
- **Bước**: ở `/product/[slug]`, chọn biến thể còn hàng, đặt số lượng, "Thêm vào giỏ".
- **Kỳ vọng**: dòng giỏ mang đúng biến thể (label "Quy cách: …"), `id = productId:variantId`, số lượng đã clamp theo tồn biến thể.

### TC-G-04 — Giỏ trống
- **Bước**: mở `/cart` khi chưa có sản phẩm.
- **Kỳ vọng**: hiển thị "Giỏ hàng trống" + nút "Khám phá đặc sản"; **không** có khối tóm tắt/checkout.

### TC-G-05 — Tăng/giảm số lượng (clamp theo tồn chi nhánh)
- **Bước**: trong `/cart`, bấm + quá tồn tối đa của chi nhánh.
- **Kỳ vọng**: nút + bị disable ở mức max; "Còn {max}" hiển thị khi max ≤ 20; thành tiền dòng = giá × số lượng cập nhật ngay.

### TC-G-06 — Giảm về 1 thì nút − disable
- **Kỳ vọng**: ở số lượng = 1, nút − bị disable (không về 0; muốn bỏ thì dùng nút xóa).

### TC-G-07 — Xóa 1 dòng
- **Bước**: bấm icon thùng rác trên dòng.
- **Kỳ vọng**: dòng biến mất; tổng tính lại; nếu hết dòng → trạng thái giỏ trống.

### TC-G-08 — Xóa tất cả (có xác nhận)
- **Bước**: "Xóa tất cả" → dialog xác nhận → Xác nhận.
- **Kỳ vọng**: `ConfirmDialog` hiện "Bạn có thật sự muốn xóa tất cả…"; chỉ khi xác nhận giỏ mới trống; Hủy thì giữ nguyên.

### TC-G-09 — Sản phẩm hết hàng tại chi nhánh đang chọn (trong giỏ)
- **Tiền đề**: đã có A trong giỏ; đổi sang chi nhánh mà A hết hàng (qua bộ chọn ở header).
- **Kỳ vọng**: dòng A chuyển trạng thái "Hết hàng tại chi nhánh đang chọn" (ẩn stepper); banner đỏ "{n} sản phẩm đã hết hàng…"; nút checkout **bị chặn** ("Xóa sản phẩm hết hàng để tiếp tục").

### TC-G-10 — Xóa nhanh sản phẩm hết hàng
- **Bước**: bấm "Xóa sản phẩm hết hàng" → xác nhận.
- **Kỳ vọng**: các dòng hết hàng bị xóa; banner biến mất; checkout mở lại nếu còn dòng hợp lệ.

### TC-G-11 — Giỏ được lưu qua reload
- **Bước**: thêm hàng, F5.
- **Kỳ vọng**: giỏ vẫn còn (persisted); badge giỏ đúng số lượng.

---

## 2. Voucher (ở giỏ)

### TC-G-12 — Áp mã hợp lệ
- **Bước**: tạm tính ≥ 200K, nhập `DACSAN10`, "Áp dụng".
- **Kỳ vọng**: chip xanh "DACSAN10 · Đã giảm …"; dòng "Giảm giá (voucher) −X"; Tổng cộng trừ đúng (giảm tối đa 30K).

### TC-G-13 — Mã không tồn tại
- **Bước**: nhập `SAISO`, "Áp dụng".
- **Kỳ vọng**: lỗi inline "Mã không hợp lệ hoặc không tồn tại"; tổng không đổi.

### TC-G-14 — Chưa đạt đơn tối thiểu
- **Bước**: tạm tính 150K, áp `GIAM50K` (cần ≥300K).
- **Kỳ vọng**: chặn áp, báo "Đơn tối thiểu 300.000 ₫".

### TC-G-15 — Danh sách "Xem mã khả dụng"
- **Bước**: mở danh sách.
- **Kỳ vọng**: mã chưa đủ điều kiện hiển thị "Mua thêm {X} để dùng" + nút Áp dụng **disabled**; mã đủ điều kiện áp được; **không vỡ layout** (mục đã fix grid/min-w-0).

### TC-G-16 — Voucher mất hiệu lực khi giảm số lượng
- **Tiền đề**: đã áp `DACSAN10` (đơn ≥200K).
- **Bước**: bớt hàng để tạm tính < 200K.
- **Kỳ vọng**: chip chuyển vàng "chưa dùng được: Đơn tối thiểu 200.000 ₫"; **không trừ tiền**; Tổng cộng = tạm tính.

### TC-G-17 — Mã FREESHIP ở giỏ
- **Bước**: áp `FREESHIP` (đơn ≥150K).
- **Kỳ vọng**: chip "Ưu đãi phí vận chuyển (áp dụng cho phí ship)"; **Tổng cộng ở giỏ KHÔNG đổi** (giỏ chưa có phí ship); giảm sẽ áp ở checkout.

### TC-G-18 — Gỡ voucher
- **Bước**: bấm "Bỏ".
- **Kỳ vọng**: chip mất; tổng trở lại; mã không còn áp ở checkout.

---

## 3. Vào Checkout (guest, không đăng nhập)

### TC-G-19 — Guest vào thẳng /checkout
- **Tiền đề**: chưa đăng nhập, giỏ có hàng hợp lệ.
- **Kỳ vọng**: **không** bị chuyển sang /login; form thanh toán hiển thị; các ô liên hệ **trống** (không prefill).

### TC-G-20 — Vào /checkout khi giỏ trống / toàn hết hàng
- **Kỳ vọng**: hiển thị "Chưa có sản phẩm để thanh toán" + nút "Về giỏ hàng"; không cho đặt.

### TC-G-21 — Có sản phẩm hết hàng khi đang ở checkout
- **Bước**: đổi chi nhánh (header) khiến 1 sản phẩm hết hàng.
- **Kỳ vọng**: banner "{n} sản phẩm đã hết hàng…" + link "Quay lại giỏ"; nút Đặt hàng bị chặn.

### TC-G-22 — Draft checkout lưu qua reload
- **Bước**: nhập thông tin, F5.
- **Kỳ vọng**: thông tin đã nhập vẫn còn (checkout.store persisted).

---

## 4. Phương thức nhận hàng & địa chỉ

### TC-G-23 — Giao tận nơi, cùng tỉnh
- **Bước**: chọn "Giao tận nơi", tỉnh = TP.HCM (trùng chi nhánh HCM), chọn "Giao tiêu chuẩn".
- **Kỳ vọng**: phí ship = 18.000 ₫; ETA "1–2 ngày".

### TC-G-24 — Giao tận nơi, khác tỉnh
- **Bước**: tỉnh = Hà Nội (chi nhánh HCM), "Giao nhanh".
- **Kỳ vọng**: phí ship = 55.000 ₫; ETA "1–2 ngày".

### TC-G-25 — Nhận tại chi nhánh (pickup)
- **Bước**: chọn "Nhận tại chi nhánh".
- **Kỳ vọng**: phí ship = **Miễn phí**; hiện thông tin chi nhánh đang chọn; **không bắt buộc** nhập địa chỉ.

### TC-G-26 — Thiếu thông tin nhận hàng (giao tận nơi)
- **Bước**: để trống Họ tên / SĐT / Tỉnh / Địa chỉ cụ thể → bấm "Đặt hàng".
- **Kỳ vọng**: nút chặn; hiện "Vui lòng nhập đầy đủ thông tin nhận hàng"; các ô thiếu viền đỏ.

### TC-G-27 — SĐT sai định dạng
- **Bước**: nhập SĐT < 9 ký tự / có chữ.
- **Kỳ vọng**: bị coi là không hợp lệ → chặn đặt hàng.

### TC-G-28 — Pickup không cần địa chỉ vẫn đặt được
- **Bước**: pickup + tên + SĐT hợp lệ (bỏ trống địa chỉ) → Đặt hàng.
- **Kỳ vọng**: hợp lệ, cho đặt.

---

## 5. Hóa đơn VAT & thanh toán

### TC-G-29 — Không xuất VAT (mặc định)
- **Kỳ vọng**: checkbox tắt; không hiện form; không bắt buộc gì thêm.

### TC-G-30 — Bật VAT nhưng thiếu thông tin
- **Bước**: tích "Xuất hóa đơn VAT", để trống Tên cty / MST / Email → Đặt hàng.
- **Kỳ vọng**: chặn; hint "Vui lòng nhập đủ thông tin xuất hóa đơn VAT"; ô thiếu viền đỏ.

### TC-G-31 — Bật VAT đầy đủ, email hợp lệ
- **Bước**: nhập đủ Tên cty + MST + email đúng định dạng.
- **Kỳ vọng**: hợp lệ; `invoice` đi kèm trong đơn.

### TC-G-32 — Email VAT sai định dạng
- **Kỳ vọng**: chặn (regex email).

### TC-G-33 — Chọn phương thức thanh toán
- **Bước**: đổi COD → MoMo.
- **Kỳ vọng**: lựa chọn cập nhật; hiển thị đúng trên màn xác nhận.

---

## 6. Voucher ở checkout (gồm phí ship)

### TC-G-34 — Voucher đơn áp ở checkout
- **Bước**: áp `DACSAN10`.
- **Kỳ vọng**: dòng "Giảm giá (voucher) −X"; tổng đúng.

### TC-G-35 — FREESHIP áp vào phí ship (giao tận nơi)
- **Bước**: áp `FREESHIP`, giao tận nơi phí 30K.
- **Kỳ vọng**: dòng "Giảm phí vận chuyển −30.000 ₫"; tổng = tạm tính + 30K − 30K.

### TC-G-36 — FREESHIP khi pickup (phí 0)
- **Kỳ vọng**: giảm phí ship = 0 (min(30K, 0)); không phát sinh dòng giảm ship vô nghĩa; tổng không âm.

---

## 7. Đặt hàng & thành công

### TC-G-37 — Đặt hàng thành công (điều hướng route riêng)
- **Tiền đề**: mọi điều kiện hợp lệ.
- **Bước**: bấm "Đặt hàng".
- **Kỳ vọng**: nút "Đang đặt hàng…" (disable); **chuyển sang `/order-success/{mã đơn}`** hiển thị "Đặt hàng thành công!" + chi tiết đơn (mã, người nhận, sản phẩm, tổng); **không** flash trạng thái giỏ trống.

### TC-G-37b — Refresh / mở lại link success
- **Bước**: ở `/order-success/{id}`, F5 (đơn đã lưu trong store).
- **Kỳ vọng**: vẫn hiển thị đúng đơn. Nếu mở mã không tồn tại trên thiết bị → "Không tìm thấy đơn hàng" + link tra cứu.

### TC-G-38 — Chống double-submit
- **Bước**: bấm "Đặt hàng" nhiều lần nhanh.
- **Kỳ vọng**: chỉ tạo 1 đơn (cờ `submitting` chặn lần sau).

### TC-G-39 — Sau đặt hàng: giỏ & voucher được dọn
- **Kỳ vọng**: `cart` rỗng, voucher đã gỡ; badge giỏ về 0.

### TC-G-40 — Popup tạo tài khoản cho guest
- **Kỳ vọng**: ở `/order-success/[id]` (guest) **popup tự bật 1 lần**, prefill sẵn tên/email/SĐT từ đơn; chỉ cần nhập mật khẩu → "Tạo tài khoản".
- Đóng được bằng "Để sau"/X/Esc/nền; có nút "Tạo tài khoản" để mở lại.
- Tạo thành công → **tự đăng nhập**, popup đóng, khối gợi ý ẩn (không còn là guest).
- Email/mật khẩu sai → báo lỗi inline; **không tự bật lại** sau khi đã đóng.

### TC-G-41 — Quay lại /checkout sau khi đặt
- **Bước**: sau success, mở lại `/checkout`.
- **Kỳ vọng**: vì giỏ đã rỗng → "Chưa có sản phẩm để thanh toán".

---

## 8. Biên (edge) & tính toán

### TC-G-42 — Tổng không âm
- **Tiền đề**: voucher giảm ≥ tạm tính (ví dụ GIAM50K trên đơn 50K — nếu đủ điều kiện).
- **Kỳ vọng**: Tổng cộng = 0, không hiển thị số âm.

### TC-G-43 — Badge "Tiết kiệm" không trừ vào tổng
- **Kỳ vọng**: badge = (giảm giá gốc + voucher), hiển thị riêng; bảng tính vẫn cộng đúng ra Tổng cộng.

### TC-G-44 — Tất cả chi nhánh đều hết một mặt hàng
- **Kỳ vọng**: ở PDP hiện "Tất cả chi nhánh đều hết mặt hàng này"; mặt hàng không thể vào giỏ/checkout.

### TC-G-45 — Responsive 360px / tablet
- **Kỳ vọng**: `/cart` và `/checkout` không scroll ngang ở 360px; tablet (md) hiển thị 2 cột; voucher & dòng sản phẩm không vỡ layout.

---

## 9. Địa chỉ thật & tra cứu đơn (bổ sung)

### TC-G-46 — Chọn địa chỉ bằng dropdown thật (API)
- **Bước**: ở checkout (giao tận nơi), chọn Tỉnh → Quận/Huyện → Phường/Xã.
- **Kỳ vọng**: Quận load sau khi chọn Tỉnh ("Đang tải…"); Phường load sau khi chọn Quận; đổi Tỉnh reset Quận/Phường.

### TC-G-47 — API địa giới lỗi → fallback
- **Tiền đề**: API `provinces.open-api.vn` không truy cập được.
- **Kỳ vọng**: tự chuyển sang **danh sách tỉnh rút gọn + ô text** cho Quận/Phường; checkout vẫn đặt được (không chặn).

### TC-G-48 — Phí ship theo mã tỉnh
- **Bước**: chọn tỉnh trùng chi nhánh (vd TP.HCM với chi nhánh HCM).
- **Kỳ vọng**: tính phí "cùng tỉnh" (rẻ hơn) dựa trên `provinceCode`, không phụ thuộc cách viết tên.

### TC-G-49 — Tra cứu đơn đúng mã + SĐT
- **Bước**: sau khi đặt, vào `/track-order`, nhập đúng mã đơn + SĐT đã đặt.
- **Kỳ vọng**: hiện chi tiết đơn (trạng thái, người nhận, sản phẩm, tổng).

### TC-G-50 — Tra cứu sai thông tin
- **Bước**: nhập sai mã hoặc SĐT.
- **Kỳ vọng**: "Không tìm thấy đơn hàng".

### TC-G-51 — Đặt hàng thất bại
- **Tiền đề**: `placeOrder` lỗi (BE/mạng).
- **Kỳ vọng**: không tạo đơn, giỏ **không** bị xóa; hiện "Đặt hàng thất bại, vui lòng thử lại."; bấm lại được.

### TC-G-52 — Logout xóa lịch sử tra cứu
- **Bước**: đăng nhập → đăng xuất.
- **Kỳ vọng**: `orders` (và toàn bộ store) bị xóa — không tra cứu được đơn của phiên trước trên thiết bị.

## Ghi chú triển khai (tham chiếu)
- Chặn checkout khi còn hàng hết tại chi nhánh: [checkout-page](../../src/features/checkout/checkout-page.tsx).
- Voucher math: [voucher.service](../../src/services/voucher.service.ts).
- Phí ship: [shipping.service](../../src/services/shipping.service.ts).
- Dọn giỏ/voucher sau đặt hàng: `clearCart()` + `clearVoucher()` trong checkout-page.
- CTA guest: [order-success](../../src/features/checkout/components/order-success/index.tsx).
