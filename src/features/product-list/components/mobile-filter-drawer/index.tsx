"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useModalDismiss } from "@/hooks/use-modal-dismiss";
import type { Facet } from "@/types/product";
import { FilterControls } from "../filter-controls";

/** Mobile-only filter trigger + slide-in panel (portaled to escape the header). */
export function MobileFilterDrawer({
  facets,
  activeCount,
}: {
  facets: Facet[];
  activeCount: number;
}) {
  const [open, setOpen] = useState(false);

  useModalDismiss(open, () => setOpen(false));

  return (
    <>
      <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setOpen(true)}>
        Bộ lọc{activeCount > 0 ? ` (${activeCount})` : ""}
      </Button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-80 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-background shadow-xl">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="font-semibold">Bộ lọc</span>
                <button onClick={() => setOpen(false)} aria-label="Đóng" className="text-xl leading-none">
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <FilterControls facets={facets} />
              </div>
              <div className="border-t p-4">
                <Button className="w-full" onClick={() => setOpen(false)}>
                  Xem kết quả
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
