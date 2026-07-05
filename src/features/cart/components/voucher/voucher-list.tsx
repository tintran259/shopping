"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/pricing";
import { amountToQualify, validateVoucher, type Voucher } from "@/services/voucher.service";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function VoucherDetail({ v, currency }: { v: Voucher; currency: string }) {
  const conditions: string[] = [];
  if (v.minSubtotal) conditions.push(`Đơn tối thiểu ${formatPrice(v.minSubtotal, currency)}`);
  if (v.type === "percent" && v.maxDiscount) conditions.push(`Giảm tối đa ${formatPrice(v.maxDiscount, currency)}`);
  if (v.endsAt) conditions.push(`Hạn dùng: ${formatDate(v.endsAt)}`);

  return (
    <div className="mt-2 space-y-1.5 rounded-lg bg-muted/60 px-3 py-2.5 text-[11px] text-muted-foreground">
      {conditions.map((c) => (
        <p key={c} className="flex items-start gap-1.5">
          <span className="mt-px shrink-0 text-[10px]">•</span>
          {c}
        </p>
      ))}
      {v.applicableProducts?.length ? (
        <p className="flex items-start gap-1.5">
          <span className="mt-px shrink-0 text-[10px]">•</span>
          <span>
            <span className="font-medium text-foreground">Áp dụng cho sản phẩm:</span>{" "}
            {v.applicableProducts.map((p) => p.name).join(", ")}
          </span>
        </p>
      ) : (
        <p className="flex items-start gap-1.5">
          <span className="mt-px shrink-0 text-[10px]">•</span>
          Áp dụng cho tất cả sản phẩm
        </p>
      )}
      {v.applicableBranches?.length ? (
        <p className="flex items-start gap-1.5">
          <span className="mt-px shrink-0 text-[10px]">•</span>
          <span>
            <span className="font-medium text-foreground">Áp dụng tại chi nhánh:</span>{" "}
            {v.applicableBranches.map((b) => b.name).join(", ")}
          </span>
        </p>
      ) : (
        <p className="flex items-start gap-1.5">
          <span className="mt-px shrink-0 text-[10px]">•</span>
          Áp dụng tại tất cả chi nhánh
        </p>
      )}
    </div>
  );
}

export function VoucherList({
  vouchers,
  isLoading = false,
  subtotal,
  currency,
  cartSlugs,
  branchId,
  appliedCode,
  onApply,
  isApplying = false,
}: {
  vouchers: Voucher[];
  isLoading?: boolean;
  subtotal: number;
  currency: string;
  cartSlugs?: string[];
  branchId?: string;
  appliedCode: string | null;
  onApply: (code: string) => void;
  isApplying?: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (vouchers.length === 0) {
    return (
      <p className="rounded-xl border border-border/60 bg-muted/30 px-4 py-4 text-center text-xs text-muted-foreground">
        Hiện không có mã khả dụng. Bạn vẫn có thể nhập mã nếu có.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {vouchers.map((v) => {
        const check = validateVoucher(v, subtotal, { cartSlugs, branchId });
        const eligible = check.ok;
        const need = amountToQualify(v, subtotal);
        const applied = appliedCode === v.code;
        const isExpanded = expanded === v.code;

        // Fix: cast to boolean to avoid rendering numbers (0) in JSX when .length is used in && chain.
        const productMismatch: boolean =
          !eligible &&
          (cartSlugs?.length ?? 0) > 0 &&
          (v.applicableProducts?.length ?? 0) > 0 &&
          !v.applicableProducts!.some((p) => cartSlugs!.includes(p.slug));

        const branchMismatch: boolean =
          !eligible &&
          !productMismatch &&
          !!branchId &&
          (v.applicableBranches?.length ?? 0) > 0 &&
          !v.applicableBranches!.some((b) => b.id === branchId);

        return (
          <li
            key={v.code}
            className="rounded-xl border border-border/60 bg-muted/30"
          >
            <div className="flex items-start gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">
                  {v.code}{" "}
                  <span className="font-normal text-muted-foreground">· {v.label}</span>
                </p>
                <p className="truncate text-[11px] text-muted-foreground">{v.description}</p>

                {/* Eligibility hints */}
                {!eligible && need > 0 && !productMismatch && !branchMismatch && (
                  <p className="mt-0.5 text-[11px] text-(--theme-warning,#b45309)">
                    Mua thêm {formatPrice(need, currency)} để dùng
                  </p>
                )}
                {productMismatch && (
                  <p className="mt-0.5 text-[11px] text-(--theme-warning,#b45309)">
                    Giỏ hàng không có sản phẩm áp dụng mã này
                  </p>
                )}
                {branchMismatch && (
                  <p className="mt-0.5 text-[11px] text-(--theme-warning,#b45309)">
                    Chi nhánh hiện tại không áp dụng mã này
                  </p>
                )}

                <button
                  type="button"
                  className="mt-1 text-[11px] font-medium text-primary hover:underline"
                  onClick={() => setExpanded(isExpanded ? null : v.code)}
                >
                  {isExpanded ? "Ẩn chi tiết" : "Chi tiết"}
                </button>
              </div>

              <div className="shrink-0 pt-0.5">
                {applied ? (
                  <span className="text-[11px] font-medium text-(--theme-in-stock,#16a34a)">
                    Đang dùng
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={!eligible || isApplying}
                    onClick={() => onApply(v.code)}
                  >
                    {isApplying ? "…" : "Áp dụng"}
                  </Button>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="px-3 pb-3">
                <VoucherDetail v={v} currency={currency} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
