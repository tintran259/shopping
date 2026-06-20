"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/pricing";
import { BANK_INFO } from "@/features/checkout/constants";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Sao chép ${label}`}
      className={cn(
        "shrink-0 rounded-md p-1 transition hover:bg-muted",
        copied ? "text-(--theme-in-stock,#16a34a)" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {copied ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

function Row({
  label,
  value,
  copyValue,
  valueClass,
}: {
  label: string;
  value: string;
  copyValue?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 items-start justify-end gap-1.5 text-right">
        <span className={cn("break-words font-medium", valueClass)}>{value}</span>
        {copyValue && <CopyButton value={copyValue} label={label.toLowerCase()} />}
      </dd>
    </div>
  );
}

/**
 * Manual bank-transfer instructions with a VietQR image (no gateway needed). The
 * order code is the transfer memo so the merchant can reconcile + confirm manually.
 */
export function BankTransfer({ amount, note, currency = "VND" }: { amount: number; note: string; currency?: string }) {
  const qr = `https://img.vietqr.io/image/${BANK_INFO.bankCode}-${BANK_INFO.accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(note)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`;

  return (
    <section className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
      <h2 className="text-base font-semibold">Thanh toán chuyển khoản</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Quét mã hoặc chuyển khoản theo thông tin dưới. Đơn được xác nhận sau khi nhận được thanh toán.
      </p>

      <div className="mt-4 flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- external VietQR image, not optimizable */}
        <img
          src={qr}
          alt="Mã QR chuyển khoản"
          width={176}
          height={176}
          className="size-44 shrink-0 rounded-xl border border-border bg-white object-contain"
        />
        <dl className="w-full space-y-2 text-sm">
          <Row label="Ngân hàng" value={BANK_INFO.bankName} />
          <Row label="Số tài khoản" value={BANK_INFO.accountNo} copyValue={BANK_INFO.accountNo} valueClass="font-semibold tabular-nums" />
          <Row label="Chủ tài khoản" value={BANK_INFO.accountName} />
          <Row
            label="Số tiền"
            value={formatPrice(amount, currency)}
            copyValue={String(amount)}
            valueClass="font-bold tabular-nums"
          />
          <Row
            label="Nội dung"
            value={note}
            copyValue={note}
            valueClass="font-semibold text-(--theme-out-of-stock,var(--destructive))"
          />
        </dl>
      </div>
    </section>
  );
}
