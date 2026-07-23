"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useModalDismiss } from "@/hooks/use-modal-dismiss";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "@/store/toast.store";
import { checkPendingSubscription, subscribeBackInStock } from "@/services/notification.service";

type Channel = "email" | "phone";
type Contact = { type: Channel; value: string; label: string };
type Status = "idle" | "loading" | "done";

// localStorage stores the contact string (email/phone) used when subscribing,
// keyed by (variantId × branchId). This lets us verify with the BE on revisit
// whether the subscription is still pending or has already been fulfilled.
// Cleared on logout (logoutAndReset → localStorage.clear()).
const storageKey = (variantId: string, branchId?: string) =>
  `notify:${variantId}:${branchId ?? "_"}`;

function getStoredContact(variantId: string, branchId?: string): string | null {
  try {
    return localStorage.getItem(storageKey(variantId, branchId));
  } catch {
    return null;
  }
}

function markSubscribed(contact: string, variantId: string, branchId?: string): void {
  try {
    localStorage.setItem(storageKey(variantId, branchId), contact);
  } catch {
    // Storage blocked (private mode) — button just resets on next visit, acceptable.
  }
}

function clearSubscribed(variantId: string, branchId?: string): void {
  try {
    localStorage.removeItem(storageKey(variantId, branchId));
  } catch { }
}

/**
 * Back-in-stock notify. Behaviour by how many contacts the customer has:
 *  - exactly 1  → register straight away, no modal.
 *  - 2 contacts → modal to CHOOSE email or phone.
 *  - 0 contacts → modal to ENTER a contact.
 */
export function NotifyStockButton({
  productName,
  variantId,
  branchId,
  className,
}: {
  productName: string;
  variantId: string;
  branchId?: string;
  className?: string;
}) {
  const email = useAuthStore((s) => s.user?.email ?? null);
  const phone = useAuthStore((s) => s.user?.phone ?? null);
  const customerId = useAuthStore((s) => s.user?.id ?? null);

  const contacts: Contact[] = [
    email ? { type: "email" as const, value: email, label: "Email" } : null,
    phone ? { type: "phone" as const, value: phone, label: "Số điện thoại" } : null,
  ].filter(Boolean) as Contact[];

  const [open, setOpen] = useState(false);
  // Lazy initializer reads localStorage for instant feedback on mount.
  // useEffect below re-syncs every time variantId/branchId changes AND
  // verifies with the BE that the subscription is still pending — if it was
  // already notified (product restocked then sold out again), clear localStorage
  // and let the user subscribe again for the new stock cycle.
  const [status, setStatus] = useState<Status>(() =>
    getStoredContact(variantId, branchId) !== null ? "done" : "idle",
  );

  useEffect(() => {
    const stored = getStoredContact(variantId, branchId);
    if (stored === null) {
      setStatus("idle");
      setOpen(false);
      return;
    }
    // Contact found in localStorage → verify the subscription is still pending.
    setStatus("done");
    setOpen(false);
    checkPendingSubscription({ variantId, contact: stored, branchId })
      .then((pending) => {
        if (!pending) {
          clearSubscribed(variantId, branchId);
          setStatus("idle");
        }
      })
      .catch(() => undefined);
  }, [variantId, branchId]);
  const [choice, setChoice] = useState<Channel>(contacts[0]?.type ?? "email");
  const [input, setInput] = useState("");

  useModalDismiss(open, () => setOpen(false));

  const register = async (contact: string) => {
    setStatus("loading");
    try {
      await subscribeBackInStock({
        variantId,
        contact,
        branchId,
        customerId: customerId ?? undefined,
      });
      setStatus("done");
      markSubscribed(contact, variantId, branchId);
      setOpen(false);
      toast.success("Đã đăng ký! Chúng tôi sẽ thông báo khi sản phẩm có hàng trở lại.");
    } catch (err) {
      setStatus("idle");
      toast.error(err instanceof Error ? err.message : "Không thể đăng ký thông báo, vui lòng thử lại.");
    }
  };

  const handleClick = () => {
    if (status !== "idle") return;
    if (contacts.length === 1) {
      register(contacts[0].value);
      return;
    }
    setOpen(true);
  };

  const confirmModal = () => {
    if (contacts.length >= 2) {
      register(contacts.find((c) => c.type === choice)!.value);
    } else if (input.trim()) {
      register(input.trim());
    }
  };

  const isLoading = status === "loading";
  const isDone = status === "done";

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className={cn("h-11 rounded-lg", className)}
        disabled={isDone || isLoading}
        onClick={handleClick}
      >
        {isDone
          ? "Đã đăng ký nhận thông báo ✓"
          : isLoading
            ? "Đang đăng ký…"
            : "Thông báo khi có hàng"}
      </Button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-80 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Thông báo khi có hàng"
              className="relative w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-2xl"
            >
              <h2 className="text-base font-semibold">Thông báo khi có hàng</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Chúng tôi sẽ báo bạn khi{" "}
                <span className="font-medium text-foreground">{productName}</span> có hàng trở lại.
              </p>

              {contacts.length >= 2 ? (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Nhận thông báo qua:</p>
                  {contacts.map((c) => (
                    <label
                      key={c.type}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition",
                        choice === c.type
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-foreground/40",
                      )}
                    >
                      <input
                        type="radio"
                        name="notify-channel"
                        checked={choice === c.type}
                        onChange={() => setChoice(c.type)}
                        className="size-4 accent-primary"
                      />
                      <span className="flex-1">
                        <span className="block text-xs text-muted-foreground">{c.label}</span>
                        <span className="font-medium">{c.value}</span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="mt-4">
                  <label className="text-sm font-medium">Email hoặc số điện thoại</label>
                  <input
                    autoFocus
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && confirmModal()}
                    placeholder="vd: ban@email.com / 09xxxxxxxx"
                    className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={confirmModal}
                  disabled={isLoading || (contacts.length < 2 && !input.trim())}
                >
                  {isLoading ? "Đang đăng ký…" : "Xác nhận"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
