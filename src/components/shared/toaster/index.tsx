"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToastStore, type Toast } from "@/store/toast.store";

const STYLES: Record<Toast["type"], { ring: string; icon: React.ReactNode }> = {
  error: {
    ring: "border-(--theme-out-of-stock,var(--destructive))/40 text-(--theme-out-of-stock,var(--destructive))",
    icon: <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />,
  },
  success: {
    ring: "border-(--theme-in-stock,#16a34a)/40 text-(--theme-in-stock,#15803d)",
    icon: <path d="M20 6 9 17l-5-5" />,
  },
  info: {
    ring: "border-(--theme-info,#2563eb)/40 text-(--theme-info,#2563eb)",
    icon: <path d="M12 16v-4M12 8h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" />,
  },
};

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 4000);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  const s = STYLES[t.type];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      role="alert"
      onClick={onDismiss}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm cursor-pointer items-start gap-2.5 rounded-xl border bg-background px-4 py-3 text-sm shadow-lg",
        s.ring,
      )}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 shrink-0">
        {s.icon}
      </svg>
      <span className="flex-1 text-foreground">{t.message}</span>
    </motion.div>
  );
}

/** App-wide toast outlet — fixed at the top, slides down. Mounted in AppProviders. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-100 flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} t={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
