"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAddressStore } from "@/store/address.store";
import type { UserAddress } from "@/store/address.store";
import { AccountShell } from "./components/account-shell";
import { AddressForm } from "./components/address-form";

function fullAddress(a: UserAddress) {
  return [a.street, a.ward, a.province].filter(Boolean).join(", ");
}

export function AddressBookPage() {
  const addresses = useAddressStore((s) => s.addresses);
  const add = useAddressStore((s) => s.add);
  const update = useAddressStore((s) => s.update);
  const remove = useAddressStore((s) => s.remove);
  const setDefault = useAddressStore((s) => s.setDefault);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserAddress | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<UserAddress | null>(null);

  const openAdd = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (a: UserAddress) => {
    setEditing(a);
    setFormOpen(true);
  };

  return (
    <AccountShell>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight">Địa chỉ của tôi</h2>
        <Button size="sm" onClick={openAdd}>
          + Thêm địa chỉ
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-base font-medium">Chưa có địa chỉ nào</p>
          <p className="mt-1 text-sm text-muted-foreground">Thêm địa chỉ để thanh toán nhanh hơn.</p>
          <Button size="sm" className="mt-3" onClick={openAdd}>
            Thêm địa chỉ
          </Button>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {addresses.map((a) => (
            <li
              key={a.id}
              className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{a.recipientName}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-sm text-muted-foreground">{a.phone}</span>
                    {a.label && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {a.label}
                      </span>
                    )}
                    {a.isDefault && (
                      <span className="rounded-full bg-(--theme-success,#059669) px-2 py-0.5 text-[11px] font-semibold text-white">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{fullAddress(a)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {!a.isDefault && (
                    <Button variant="ghost" size="sm" onClick={() => setDefault(a.id)}>
                      Đặt mặc định
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => openEdit(a)}>
                    Sửa
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setPendingDelete(a)}>
                    Xóa
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddressForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={(data) => {
          if (editing) update(editing.id, data);
          else add(data);
          setFormOpen(false);
        }}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Xóa địa chỉ"
        description={pendingDelete ? `Xóa địa chỉ của ${pendingDelete.recipientName}?` : undefined}
        confirmLabel="Xóa"
        danger
        onConfirm={() => {
          if (pendingDelete) remove(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </AccountShell>
  );
}
