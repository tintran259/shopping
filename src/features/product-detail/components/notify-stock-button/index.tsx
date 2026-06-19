"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCustomerStore } from "@/store/customer.store";

type Channel = "email" | "phone";
type Contact = { type: Channel; value: string; label: string };

/**
 * Back-in-stock notify. Behaviour by how many contacts the customer has:
 *  - exactly 1  → register straight away, no modal.
 *  - 2 contacts → modal to CHOOSE email or phone.
 *  - 0 contacts → modal to ENTER a contact.
 */
export function NotifyStockButton({
  productName,
  className,
}: {
  productName: string;
  className?: string;
}) {
  const email = useCustomerStore((s) => s.email);
  const phone = useCustomerStore((s) => s.phone);

  const contacts: Contact[] = [
    email ? { type: "email" as const, value: email, label: "Email" } : null,
    phone ? { type: "phone" as const, value: phone, label: "Số điện thoại" } : null,
  ].filter(Boolean) as Contact[];

  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [choice, setChoice] = useState<Channel>(contacts[0]?.type ?? "email");
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // TODO: POST to the BE back-in-stock subscription endpoint.
  const register = (via: string) => {
    setDone(via);
    setOpen(false);
  };

  const handleClick = () => {
    if (done) return;
    if (contacts.length === 1) return register(contacts[0].value); // single contact → no modal
    setOpen(true); // 0 or 2 → modal
  };

  const confirmModal = () => {
    if (contacts.length >= 2) {
      register(contacts.find((c) => c.type === choice)!.value);
    } else if (input.trim()) {
      register(input.trim());
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className={cn("h-11 rounded-lg", className)}
        disabled={!!done}
        onClick={handleClick}
      >
        {done ? "Đã đăng ký nhận thông báo ✓" : "Thông báo khi có hàng"}
      </Button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
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
                        choice === c.type ? "border-primary bg-primary/5" : "border-border hover:border-foreground/40",
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
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Hủy
                </Button>
                <Button size="sm" onClick={confirmModal} disabled={contacts.length < 2 && !input.trim()}>
                  Xác nhận
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
