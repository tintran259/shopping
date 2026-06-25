"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AddressFields } from "@/components/shared/address-fields";
import type { UserAddress } from "@/store/address.store";

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none";

type FormData = Omit<UserAddress, "id">;

const EMPTY: FormData = {
  label: "",
  recipientName: "",
  phone: "",
  provinceCode: "",
  province: "",
  wardCode: "",
  ward: "",
  street: "",
  isDefault: false,
};

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-xs font-medium text-muted-foreground">
      {children} {required && <span className="text-destructive">*</span>}
    </label>
  );
}

/** Add/edit address modal. `initial` = edit mode. */
export function AddressForm({
  open,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial?: UserAddress;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}) {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Reset the form to the edited address (or blank) each time the modal opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(initial ? { ...initial } : EMPTY);
    setShowErrors(false);
  }, [open, initial]);

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

  const valid = form.recipientName.trim() && form.phone.trim() && form.province && form.street.trim();
  const patch = (p: Partial<FormData>) => setForm((f) => ({ ...f, ...p }));
  const errCls = (v: string) => showErrors && !v.trim() && "border-destructive focus:border-destructive";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setShowErrors(true);
      return;
    }
    onSubmit(form);
  };

  return createPortal(
    <div className="fixed inset-0 z-90 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={initial ? "Sửa địa chỉ" : "Thêm địa chỉ"}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-2xl"
      >
        <h2 className="text-base font-semibold">{initial ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}</h2>

        <form onSubmit={submit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label required>Họ và tên</Label>
              <input
                value={form.recipientName}
                onChange={(e) => patch({ recipientName: e.target.value })}
                placeholder="Nguyễn Văn A"
                className={cn(inputCls, errCls(form.recipientName))}
              />
            </div>
            <div>
              <Label required>Số điện thoại</Label>
              <input
                value={form.phone}
                inputMode="tel"
                onChange={(e) => patch({ phone: e.target.value })}
                placeholder="09xx xxx xxx"
                className={cn(inputCls, errCls(form.phone))}
              />
            </div>
          </div>

          <AddressFields value={form} onChange={patch} showErrors={showErrors} />

          <div>
            <Label>Nhãn (tùy chọn)</Label>
            <input
              value={form.label ?? ""}
              onChange={(e) => patch({ label: e.target.value })}
              placeholder="Nhà riêng / Công ty…"
              className={inputCls}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => patch({ isDefault: e.target.checked })}
              className="size-4 accent-(--theme-btn-primary-bg,var(--primary))"
            />
            Đặt làm địa chỉ mặc định
          </label>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" size="sm">
              {initial ? "Lưu thay đổi" : "Thêm địa chỉ"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
