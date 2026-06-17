"use client";

import { useState } from "react";
import type { Branch } from "@/types/branch";
import { useBranchStore } from "@/store/branch.store";
import { resolveDefaultBranch } from "@/services/branch.service";
import { MapPinIcon, ChevronDownIcon } from "./icons";
import { BranchModal } from "./branch-modal";

/**
 * Header branch picker. Reads the selected id from the persisted store and
 * resolves it against the fetched branch list (server state passed as a prop),
 * falling back to the default branch. Opens a modal to switch branches.
 */
export function BranchSelector({ branches }: { branches: Branch[] }) {
  const [open, setOpen] = useState(false);
  const selectedId = useBranchStore((s) => s.selectedBranchId);
  const select = useBranchStore((s) => s.select);

  if (branches.length === 0) return null;

  const current =
    branches.find((b) => b.id === selectedId) ?? resolveDefaultBranch(branches);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex max-w-[180px] items-center gap-1.5 rounded-md px-2 py-1.5 text-left hover:bg-muted"
      >
        <MapPinIcon className="shrink-0 text-muted-foreground" />
        <span className="hidden min-w-0 flex-col leading-tight sm:flex">
          <span className="text-[10px] text-muted-foreground">Chi nhánh</span>
          <span className="truncate text-xs font-medium">
            {current?.name ?? "Chọn chi nhánh"}
          </span>
        </span>
        <ChevronDownIcon className="hidden shrink-0 text-muted-foreground sm:block" />
      </button>

      {open && (
        <BranchModal
          branches={branches}
          selectedId={current?.id ?? null}
          onSelect={select}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
