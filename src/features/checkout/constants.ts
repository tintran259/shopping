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
  /** Needs a real gateway/BE — shown disabled until integrated. */
  comingSoon?: boolean;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "cod", label: "Thanh toán khi nhận hàng (COD)", description: "Trả tiền mặt khi nhận hàng" },
  { id: "bank", label: "Chuyển khoản ngân hàng", description: "Quét mã QR / chuyển khoản, đối soát thủ công" },
  { id: "momo", label: "Ví MoMo", description: "Thanh toán qua ứng dụng MoMo", comingSoon: true },
  { id: "card", label: "Thẻ ATM / Visa / Mastercard", description: "Thẻ nội địa & quốc tế", comingSoon: true },
];

/** Bank account for manual transfer (VietQR). Replace with the real merchant account. */
export const BANK_INFO = {
  bankCode: "VCB",
  accountNo: "0123456789",
  accountName: "CONG TY LATA'S DALAT",
  bankName: "Vietcombank",
};
