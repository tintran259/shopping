"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CloseIcon } from "@/components/shared/icons";
import { formatPrice } from "@/lib/pricing";
import { useVoucherStore } from "@/store/voucher.store";
import { useBranchStore } from "@/store/branch.store";
import { useAuthStore } from "@/store/auth.store";
import { useModalDismiss } from "@/hooks/use-modal-dismiss";
import { toast } from "@/store/toast.store";
import {
  applyVoucherCode,
  discountFor,
  fetchAvailableVouchers,
  findVoucher,
  validateVoucher,
} from "@/services/voucher.service";
import { VoucherList } from "./voucher-list";

function TicketIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v14" strokeDasharray="2 3" />
    </svg>
  );
}

export function VoucherSection({
  subtotal,
  currency = "VND",
  cartSlugs,
}: {
  subtotal: number;
  currency?: string;
  cartSlugs?: string[];
}) {
  const appliedCode = useVoucherStore((s) => s.appliedCode);
  const appliedVoucher = useVoucherStore((s) => s.appliedVoucher);
  const apply = useVoucherStore((s) => s.apply);
  const clear = useVoucherStore((s) => s.clear);
  const branchId = useBranchStore((s) => s.selectedBranchId) ?? undefined;
  const token = useAuthStore((s) => s.token);
  const customerId = useAuthStore((s) => s.user?.id) ?? undefined;
  const isAuthReady = useAuthStore((s) => s._hasHydrated);

  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Lazy: only fetch when the popup opens.
  // customerId in key ensures a fresh fetch after login/logout (different cache per session).
  // Shares cache with CartPage (same key). enabled: isAuthReady ensures we never fire a
  // guest fetch that gets immediately replaced once the persisted token is restored.
  const { data: vouchers = [], isLoading: listLoading } = useQuery({
    queryKey: ["vouchers", customerId ?? null],
    queryFn: () => fetchAvailableVouchers(customerId),
    staleTime: 5 * 60_000,
    enabled: isAuthReady,
  });

  useModalDismiss(showPopup, () => setShowPopup(false));

  const ctx = { cartSlugs, branchId, customerId };
  const check = appliedVoucher ? validateVoucher(appliedVoucher, subtotal, ctx) : null;
  const discount = appliedVoucher ? discountFor(appliedVoucher, subtotal, ctx) : 0;

  // ── Auto-clear: product / branch / subtotal / expiry scope ─────────────
  // Skip auth-scope failures only — the token-change effect below handles those
  // with a clearer message and prevents a double toast on logout.
  useEffect(() => {
    if (!appliedVoucher || check?.ok !== false) return;
    const isAuthReason =
      check.reason === "Yêu cầu đăng nhập để sử dụng mã này" ||
      check.reason === "Chỉ áp dụng cho khách vãng lai (không cần tài khoản)";
    if (isAuthReason) return;
    const code = appliedVoucher.code;
    const reason = check.reason ?? "không còn áp dụng được";
    clear();
    toast.info(`Đã gỡ mã ${code}: ${reason}`);
  }, [appliedVoucher, check?.ok, check?.reason, clear]);

  // ── Auto-clear: auth change (customer-scope vouchers) ───────────────────
  const prevToken = useRef(token);
  useEffect(() => {
    if (prevToken.current === token) return;
    prevToken.current = token;
    if (!appliedVoucher) return;
    const code = appliedVoucher.code;
    clear();
    toast.info(`Đã gỡ mã ${code}: vui lòng áp dụng lại sau khi đổi tài khoản`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Apply from popup — local pre-check first for immediate feedback, then BE for limit check.
  const onApplyFromPopup = async (code: string) => {
    const v = findVoucher(code, vouchers);
    if (!v) return;
    const res = validateVoucher(v, subtotal, ctx);
    if (!res.ok) {
      toast.info(res.reason ?? "Mã không thể áp dụng");
      return;
    }
    setApplying(true);
    try {
      const validated = await applyVoucherCode(code, subtotal, 0, customerId, branchId, cartSlugs);
      apply(validated);
      setShowPopup(false);
    } catch (e) {
      toast.info(e instanceof Error ? e.message : "Mã không thể áp dụng");
    } finally {
      setApplying(false);
    }
  };

  // Apply from manual input — local pre-check if code is in list, then always calls BE to verify limit.
  const onApply = async (raw: string) => {
    const code = raw.trim();
    if (!code) return;
    setApplying(true);
    setError(null);

    const cached = findVoucher(code, vouchers);
    if (cached) {
      const res = validateVoucher(cached, subtotal, ctx);
      if (!res.ok) {
        setError(res.reason ?? "Không thể áp dụng mã này");
        setApplying(false);
        return;
      }
    }

    // Always call BE — verifies usage limits and validates private codes not in list.
    try {
      const validated = await applyVoucherCode(code, subtotal, 0, customerId, branchId, cartSlugs);
      apply(validated);
      setInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mã không hợp lệ hoặc không tồn tại");
    } finally {
      setApplying(false);
    }
  };

  // ── Applied + still valid → success chip ─────────────────────────────────
  if (appliedVoucher && check?.ok) {
    return (
      <div className="flex items-start justify-between gap-2 rounded-lg border border-(--theme-in-stock,#16a34a)/40 bg-(--theme-in-stock,#16a34a)/5 px-3 py-2.5">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <TicketIcon /> {appliedVoucher.code}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {appliedVoucher.type === "shipping"
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
    <>
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && !applying && void onApply(input)}
            placeholder="Nhập mã giảm giá"
            className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm uppercase placeholder:normal-case placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => void onApply(input)}
            disabled={!input.trim() || applying}
          >
            {applying ? "Đang kiểm tra…" : "Áp dụng"}
          </Button>
        </div>

        {error && <p className="text-xs text-(--theme-out-of-stock,var(--destructive))">{error}</p>}

        <button
          type="button"
          onClick={() => setShowPopup(true)}
          className="text-xs font-medium text-primary hover:underline"
        >
          Xem mã khả dụng
        </button>
      </div>

      {/* Voucher picker popup */}
      {showPopup &&
        createPortal(
          <div className="fixed inset-0 z-90 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowPopup(false)}
              aria-hidden
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Mã giảm giá khả dụng"
              className="relative flex max-h-[90svh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-2xl sm:rounded-2xl"
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-4">
                <h2 className="text-base font-semibold">Mã giảm giá</h2>
                <button
                  type="button"
                  onClick={() => setShowPopup(false)}
                  aria-label="Đóng"
                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto p-4">
                <VoucherList
                  vouchers={vouchers}
                  isLoading={listLoading}
                  subtotal={subtotal}
                  currency={currency}
                  cartSlugs={cartSlugs}
                  branchId={branchId}
                  customerId={customerId}
                  appliedCode={appliedCode}
                  onApply={onApplyFromPopup}
                  isApplying={applying}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
