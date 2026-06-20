/** Province list — values match `branch.city` so intra-province shipping is detected. */
export const VN_PROVINCES = [
  "TP. Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Bình Dương",
  "Đồng Nai",
  "Cần Thơ",
  "Hải Phòng",
  "Khánh Hòa",
  "Lâm Đồng",
  "Bà Rịa - Vũng Tàu",
] as const;

export interface PaymentMethod {
  id: string;
  label: string;
  description: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "cod", label: "Thanh toán khi nhận hàng (COD)", description: "Trả tiền mặt khi nhận hàng" },
  { id: "bank", label: "Chuyển khoản ngân hàng", description: "Quét mã QR / chuyển khoản trực tiếp" },
  { id: "momo", label: "Ví MoMo", description: "Thanh toán qua ứng dụng MoMo" },
  { id: "card", label: "Thẻ ATM / Visa / Mastercard", description: "Thẻ nội địa & quốc tế" },
];
