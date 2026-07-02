"use client";

import { createPortal } from "react-dom";
import { useModalDismiss } from "@/hooks/use-modal-dismiss";
import type { Branch } from "@/types/branch";
import { CloseIcon, MapPinIcon, CheckIcon } from "./icons";

/** Group branches by city, preserving first-seen city order. */
function groupByCity(branches: Branch[]): [string, Branch[]][] {
  const map = new Map<string, Branch[]>();
  for (const b of branches) {
    const list = map.get(b.city) ?? [];
    list.push(b);
    map.set(b.city, list);
  }
  return [...map.entries()];
}

export function BranchModal({
  branches,
  selectedId,
  onSelect,
  onClose,
}: {
  branches: Branch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  // Conditionally mounted, so the modal is always "open" while rendered.
  useModalDismiss(true, onClose);

  const groups = groupByCity(branches);

  // Portal to <body> so `fixed` escapes the header's backdrop-filter container.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chọn chi nhánh"
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
    >
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-background shadow-xl sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-heading text-lg font-semibold">Chọn chi nhánh</h2>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-md hover:bg-muted"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {groups.map(([city, list]) => (
            <section key={city} className="mb-2">
              <h3 className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {city}
              </h3>
              <ul className="space-y-1">
                {list.map((b) => {
                  const active = b.id === selectedId;
                  return (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(b.id);
                          onClose();
                        }}
                        aria-pressed={active}
                        className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition ${
                          active ? "bg-muted ring-1 ring-primary/30" : "hover:bg-muted"
                        }`}
                      >
                        <MapPinIcon className="mt-0.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">{b.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {b.address}
                          </span>
                          {b.phone && (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              ☎ {b.phone}
                            </span>
                          )}
                        </span>
                        {active && (
                          <CheckIcon className="mt-0.5 shrink-0 text-primary" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
