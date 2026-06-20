"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/pricing";
import { useVoucherStore } from "@/store/voucher.store";
import { discountFor, findVoucher, validateVoucher } from "@/services/voucher.service";
import { VoucherList } from "./voucher-list";

function TicketIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v14" strokeDasharray="2 3" />
    </svg>
  );
}

/** Voucher entry for the cart summary. Re-validates the applied code against the
 *  current subtotal every render so removing items can't keep a no-longer-valid code. */
export function VoucherSection({ subtotal, currency = "VND" }: { subtotal: number; currency?: string }) {
  const appliedCode = useVoucherStore((s) => s.appliedCode);
  const apply = useVoucherStore((s) => s.apply);
  const clear = useVoucherStore((s) => s.clear);

  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);

  const voucher = appliedCode ? findVoucher(appliedCode) : undefined;
  const check = voucher ? validateVoucher(voucher, subtotal) : null;
  const discount = voucher ? discountFor(voucher, subtotal) : 0;

  const onApply = (raw: string) => {
    const code = raw.trim();
    if (!code) return;
    const v = findVoucher(code);
    if (!v) {
      setError("Mã không hợp lệ hoặc không tồn tại");
      return;
    }
    const res = validateVoucher(v, subtotal);
    if (!res.ok) {
      setError(res.reason ?? "Không thể áp dụng mã này");
      return;
    }
    apply(v.code);
    setInput("");
    setError(null);
    setShowList(false);
  };

  // Applied + still valid → success chip.
  if (voucher && check?.ok) {
    return (
      <div className="flex items-start justify-between gap-2 rounded-lg border border-(--theme-in-stock,#16a34a)/40 bg-(--theme-in-stock,#16a34a)/5 px-3 py-2.5">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <TicketIcon /> {voucher.code}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {voucher.type === "shipping"
              ? "Ưu đãi phí vận chuyển (áp dụng cho phí ship)"
              : `Đã giảm ${formatPrice(discount, currency)}`}
          </p>
        </div>
        <button
          type="button"
          onClick={clear}
          className="shrink-0 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
        >
          Bỏ
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Applied earlier but no longer eligible (e.g. items removed). */}
      {voucher && check && !check.ok && (
        <div className="flex items-start justify-between gap-2 rounded-lg border border-(--theme-warning,#d97706)/40 bg-(--theme-warning,#d97706)/10 px-3 py-2 text-xs text-(--theme-warning,#b45309)">
          <span>
            Mã <b>{voucher.code}</b> chưa dùng được: {check.reason}.
          </span>
          <button type="button" onClick={clear} className="shrink-0 font-medium hover:underline">
            Bỏ
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && onApply(input)}
          placeholder="Nhập mã giảm giá"
          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm uppercase placeholder:normal-case placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <Button
          size="sm"
          variant="outline"
          className="shrink-0"
          onClick={() => onApply(input)}
          disabled={!input.trim()}
        >
          Áp dụng
        </Button>
      </div>

      {error && <p className="text-xs text-(--theme-out-of-stock,var(--destructive))">{error}</p>}

      <button
        type="button"
        onClick={() => setShowList((s) => !s)}
        className="text-xs font-medium text-primary hover:underline"
      >
        {showList ? "Ẩn mã khả dụng" : "Xem mã khả dụng"}
      </button>

      {showList && (
        <VoucherList
          subtotal={subtotal}
          currency={currency}
          appliedCode={appliedCode}
          onApply={onApply}
        />
      )}
    </div>
  );
}
