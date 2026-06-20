"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none";

/**
 * Post-order account creation popup. Prefilled from the just-placed order so the
 * guest only has to set a password. On success the user is logged in and the modal
 * closes (the caller re-renders as authenticated).
 */
export function QuickRegisterModal({
  open,
  defaults,
  onClose,
}: {
  open: boolean;
  defaults: { name?: string; email?: string; phone?: string };
  onClose: () => void;
}) {
  const { register, status, error, clearError } = useAuth();

  const [name, setName] = useState(defaults.name ?? "");
  const [email, setEmail] = useState(defaults.email ?? "");
  const [phone, setPhone] = useState(defaults.phone ?? "");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!name.trim() || !email.trim()) return;
    if (password.length < 6) {
      setLocalError("Mật khẩu cần tối thiểu 6 ký tự.");
      return;
    }
    const ok = await register({ name, email, phone, password });
    if (ok) onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tạo tài khoản"
        className="relative w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-base font-semibold">Tạo tài khoản để theo dõi đơn</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Thông tin đã điền sẵn từ đơn vừa đặt — chỉ cần đặt mật khẩu.
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Họ và tên" className={inputCls} />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) clearError();
            }}
            placeholder="Email"
            className={inputCls}
          />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Số điện thoại" className={inputCls} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu (tối thiểu 6 ký tự)"
            className={inputCls}
            autoFocus
          />

          {(localError || error) && (
            <p className="text-xs text-(--theme-out-of-stock,var(--destructive))">{localError ?? error}</p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Để sau
            </Button>
            <Button type="submit" size="sm" disabled={status === "loading" || !name.trim() || !email.trim() || !password}>
              {status === "loading" ? "Đang tạo…" : "Tạo tài khoản"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
