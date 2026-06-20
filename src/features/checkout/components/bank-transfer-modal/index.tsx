"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { BankTransfer } from "@/features/orders/components/bank-transfer";

/**
 * Bank-transfer step shown after "Đặt hàng" when paying by transfer. The order is
 * only placed once the customer taps "Xác nhận đã thanh toán" (the QR memo = the
 * order code that will be created). Closing without confirming places nothing.
 */
export function BankTransferModal({
  open,
  amount,
  note,
  currency,
  submitting,
  onConfirm,
  onClose,
}: {
  open: boolean;
  amount: number;
  note: string;
  currency: string;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !submitting && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, submitting, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-90 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => !submitting && onClose()} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Thanh toán chuyển khoản"
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-background p-4 shadow-2xl"
      >
        <BankTransfer amount={amount} note={note} currency={currency} />

        <div className="mt-4 flex flex-col gap-2">
          <Button size="lg" className="w-full" disabled={submitting} onClick={onConfirm}>
            {submitting ? "Đang xử lý…" : "Xác nhận đã thanh toán"}
          </Button>
          <Button variant="ghost" className="w-full" disabled={submitting} onClick={onClose}>
            Để sau
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
