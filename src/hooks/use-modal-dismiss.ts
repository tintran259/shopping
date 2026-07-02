"use client";

import { useEffect } from "react";

/**
 * Shared modal dismiss behavior: close on Escape and lock body scroll while
 * open. Pass `true` for modals that are conditionally mounted. Guard Escape
 * inside `onClose` when it must be ignored (e.g. mid-submit).
 */
export function useModalDismiss(open: boolean, onClose: () => void): void {
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
}
