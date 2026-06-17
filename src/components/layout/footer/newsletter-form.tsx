"use client";

import { useState } from "react";

/**
 * Email capture for the footer. Client-only; the actual subscribe call will go
 * through a service/React Query mutation when the BE endpoint exists.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="text-sm text-(--theme-footer-text,var(--background))">
        Cảm ơn bạn đã đăng ký! 🎉
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (email.trim()) setDone(true); // TODO: call subscribe service
      }}
      className="flex w-full max-w-sm items-center gap-2"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email của bạn"
        aria-label="Email đăng ký nhận tin"
        className="h-10 w-full rounded-md border border-(--theme-footer-border,var(--border)) bg-transparent px-3 text-sm text-(--theme-footer-text,var(--background)) outline-none placeholder:text-(--theme-footer-link,var(--muted-foreground)) focus:border-(--theme-footer-link-hover,var(--ring))"
      />
      <button
        type="submit"
        className="h-10 shrink-0 rounded-md bg-(--theme-primary,var(--primary)) px-4 text-sm font-medium text-(--theme-text-on-primary,var(--primary-foreground)) transition hover:opacity-90"
      >
        Đăng ký
      </button>
    </form>
  );
}
