"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useCartStore } from "@/store/cart.store";
import { useBranchStore } from "@/store/branch.store";
import { useVoucherStore } from "@/store/voucher.store";
import { useCheckoutStore } from "@/store/checkout.store";
import { useAuthStore } from "@/store/auth.store";
import { useOrderStore } from "@/store/order.store";
import { BRANCH_IDS, resolveDefaultBranch } from "@/services/branch.service";
import { getDeliveryMethods, PICKUP_METHOD } from "@/services/shipping.service";
import { discountFor, findVoucher, shippingDiscountFor } from "@/services/voucher.service";
import { placeOrder } from "@/services/order.service";
import type { Branch } from "@/types/branch";
import type { CartLine } from "@/store/cart.store";
import { ContactAddress } from "./components/contact-address";
import { DeliveryOptions } from "./components/delivery-options";
import { PaymentOptions } from "./components/payment-options";
import { OrderSummary } from "./components/order-summary";
import { VatInvoice } from "./components/vat-invoice";
import { PAYMENT_METHODS } from "./constants";

export function CheckoutPage({ branches }: { branches: Branch[] }) {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const clearCart = useCartStore((s) => s.clear);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const appliedCode = useVoucherStore((s) => s.appliedCode);
  const clearVoucher = useVoucherStore((s) => s.clear);
  const addOrder = useOrderStore((s) => s.addOrder);
  const checkout = useCheckoutStore();
  const authUser = useAuthStore((s) => s.user);

  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client mount gate
  useEffect(() => setMounted(true), []);

  // Prefill contact from the logged-in user once, if blank (guests fill it in manually).
  useEffect(() => {
    const patch: Partial<typeof checkout> = {};
    if (!checkout.recipientName && authUser?.name) patch.recipientName = authUser.name;
    if (!checkout.phone && authUser?.phone) patch.phone = authUser.phone;
    if (!checkout.email && authUser?.email) patch.email = authUser.email;
    if (Object.keys(patch).length) checkout.update(patch);

    // Prefill VAT-invoice fields for business accounts (don't force the toggle on).
    const inv: Partial<typeof checkout.invoice> = {};
    if (!checkout.invoice.companyName && authUser?.companyName) inv.companyName = authUser.companyName;
    if (!checkout.invoice.taxCode && authUser?.taxCode) inv.taxCode = authUser.taxCode;
    if (!checkout.invoice.email && authUser?.email) inv.email = authUser.email;
    if (Object.keys(inv).length) checkout.setInvoice(inv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  const branchId = selectedBranchId ?? BRANCH_IDS[0];
  const branch = branches.find((b) => b.id === branchId) ?? resolveDefaultBranch(branches);

  const availOf = (line: CartLine) => {
    const entry = line.branchStock?.find((b) => b.branchId === branchId);
    return line.branchStock ? (entry?.inStock ?? false) : true;
  };
  const okLines = lines.filter(availOf);
  const oosCount = lines.length - okLines.length;

  const subtotal = okLines.reduce((s, l) => s + l.price * l.quantity, 0);
  const currency = lines[0]?.currency ?? "VND";

  const isPickup = checkout.fulfillment === "pickup";
  const addr = checkout.address;
  const sameProvince =
    addr.provinceCode && branch?.provinceCode
      ? addr.provinceCode === branch.provinceCode
      : !!addr.province && branch?.city === addr.province;
  const deliveryMethods = getDeliveryMethods(sameProvince);
  const shippingMethod = isPickup
    ? PICKUP_METHOD
    : deliveryMethods.find((m) => m.id === checkout.shippingMethodId) ?? deliveryMethods[0];
  const shippingFee = shippingMethod.fee;

  const voucher = appliedCode ? findVoucher(appliedCode) : undefined;
  const productDiscount = voucher ? discountFor(voucher, subtotal) : 0;
  const shippingDiscount = voucher ? shippingDiscountFor(voucher, subtotal, shippingFee) : 0;
  const total = Math.max(0, subtotal - productDiscount + shippingFee - shippingDiscount);

  // Validation
  const phoneOk = /^[0-9\s+]{9,}$/.test(checkout.phone.trim());
  const addressOk =
    isPickup || (!!checkout.address.province && !!checkout.address.street.trim());
  const contactOk = !!checkout.recipientName.trim() && phoneOk && addressOk;
  const inv = checkout.invoice;
  const invoiceOk =
    !inv.requested ||
    (!!inv.companyName.trim() && !!inv.taxCode.trim() && /\S+@\S+\.\S+/.test(inv.email.trim()));
  const canPlace = okLines.length > 0 && oosCount === 0 && contactOk && invoiceOk;
  const invalidHint =
    oosCount > 0
      ? "Giỏ hàng có sản phẩm hết hàng — quay lại giỏ để xử lý."
      : !contactOk
        ? "Vui lòng nhập đầy đủ thông tin nhận hàng."
        : "Vui lòng nhập đủ thông tin xuất hóa đơn VAT.";

  const onPlace = async () => {
    if (submitting) return;
    if (!canPlace) {
      setShowErrors(true);
      return;
    }
    setSubmitting(true);
    setPlaceError(null);
    try {
      const order = await placeOrder({
        branchId,
        fulfillment: checkout.fulfillment,
        recipient: { name: checkout.recipientName, phone: checkout.phone, email: checkout.email },
        address: isPickup ? undefined : checkout.address,
        shippingMethodId: shippingMethod.id,
        paymentMethodId: checkout.paymentMethodId,
        invoice: inv.requested
          ? { companyName: inv.companyName, taxCode: inv.taxCode, address: inv.address, email: inv.email }
          : undefined,
        voucherCode: appliedCode,
        items: okLines.map((l) => ({ id: l.id, name: l.name, price: l.price, quantity: l.quantity })),
        subtotal,
        shippingFee,
        discount: productDiscount + shippingDiscount,
        total,
      });
      addOrder({
        id: order.id,
        createdAt: order.createdAt,
        status: "Đang xử lý",
        recipientName: checkout.recipientName,
        phone: checkout.phone,
        email: checkout.email || undefined,
        fulfillment: checkout.fulfillment,
        paymentLabel: PAYMENT_METHODS.find((m) => m.id === checkout.paymentMethodId)?.label ?? "—",
        branchName: isPickup ? branch?.name : undefined,
        address: isPickup
          ? undefined
          : [checkout.address.street, checkout.address.ward, checkout.address.district, checkout.address.province]
              .filter(Boolean)
              .join(", "),
        items: okLines.map((l) => ({ id: l.id, name: l.name, price: l.price, quantity: l.quantity, image: l.image })),
        subtotal,
        shippingFee,
        discount: productDiscount + shippingDiscount,
        total,
        currency,
      });
      clearCart();
      clearVoucher();
      // Stay in the submitting state through navigation so the cleared cart never
      // flashes the empty-cart guard.
      router.push(`/order-success/${order.id}`);
    } catch {
      setPlaceError("Đặt hàng thất bại, vui lòng thử lại.");
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_340px] lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (okLines.length === 0 && !submitting) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-base font-medium">Chưa có sản phẩm để thanh toán</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Giỏ hàng trống hoặc các sản phẩm đã hết hàng tại chi nhánh đang chọn.
        </p>
        <Link href="/cart" className={cn(buttonVariants(), "mt-2")}>
          Về giỏ hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_340px] md:items-start lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-5">
        {oosCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-(--theme-out-of-stock,var(--destructive))/30 bg-(--theme-out-of-stock,var(--destructive))/5 px-4 py-3 text-sm text-(--theme-out-of-stock,var(--destructive))">
            <span>
              <b>{oosCount} sản phẩm</b> đã hết hàng tại chi nhánh đang chọn.
            </span>
            <Link href="/cart" className="font-medium underline">
              Quay lại giỏ
            </Link>
          </div>
        )}

        <DeliveryOptions branch={branch} methods={deliveryMethods} currency={currency} />
        <ContactAddress showErrors={showErrors} />
        <VatInvoice showErrors={showErrors} />
        <PaymentOptions />
      </div>

      <OrderSummary
        lines={okLines}
        currency={currency}
        subtotal={subtotal}
        productDiscount={productDiscount}
        shippingFee={shippingFee}
        shippingDiscount={shippingDiscount}
        total={total}
        isPickup={isPickup}
        submitting={submitting}
        canPlace={canPlace}
        invalidHint={invalidHint}
        error={placeError}
        onPlace={onPlace}
      />
    </div>
  );
}
