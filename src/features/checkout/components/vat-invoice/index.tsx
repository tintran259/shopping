"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { useCheckoutStore } from "@/store/checkout.store";

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-xs font-medium text-muted-foreground">
      {children} {required && <span className="text-destructive">*</span>}
    </label>
  );
}

/** Optional VAT (red) invoice request. Prominent for B2B; collapsible for everyone.
 *  Memoized so keystrokes in sibling checkout sections don't re-render it. */
export const VatInvoice = memo(function VatInvoice({ showErrors }: { showErrors: boolean }) {
  const invoice = useCheckoutStore((s) => s.invoice);
  const setInvoice = useCheckoutStore((s) => s.setInvoice);
  const missing = (v: string) => showErrors && invoice.requested && !v.trim();
  const errCls = (v: string) => missing(v) && "border-destructive focus:border-destructive";

  return (
    <section className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={invoice.requested}
          onChange={(e) => setInvoice({ requested: e.target.checked })}
          className="mt-0.5 size-4 accent-(--theme-btn-primary-bg,var(--primary))"
        />
        <span>
          <span className="block text-base font-semibold">Xuất hóa đơn VAT</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Hóa đơn giá trị gia tăng cho doanh nghiệp / cơ quan.
          </span>
        </span>
      </label>

      {invoice.requested && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <Label required>Tên công ty</Label>
            <input
              value={invoice.companyName}
              onChange={(e) => setInvoice({ companyName: e.target.value })}
              placeholder="Công ty TNHH ABC"
              className={cn(inputCls, errCls(invoice.companyName))}
            />
          </div>
          <div>
            <Label required>Mã số thuế</Label>
            <input
              value={invoice.taxCode}
              inputMode="numeric"
              onChange={(e) => setInvoice({ taxCode: e.target.value })}
              placeholder="0312345678"
              className={cn(inputCls, errCls(invoice.taxCode))}
            />
          </div>
          <div className="lg:col-span-2">
            <Label>Địa chỉ xuất hóa đơn</Label>
            <input
              value={invoice.address}
              onChange={(e) => setInvoice({ address: e.target.value })}
              placeholder="Địa chỉ đăng ký kinh doanh"
              className={inputCls}
            />
          </div>
          <div className="lg:col-span-2">
            <Label required>Email nhận hóa đơn</Label>
            <input
              value={invoice.email}
              inputMode="email"
              onChange={(e) => setInvoice({ email: e.target.value })}
              placeholder="ketoan@congty.com"
              className={cn(inputCls, errCls(invoice.email))}
            />
          </div>
        </div>
      )}
    </section>
  );
});
