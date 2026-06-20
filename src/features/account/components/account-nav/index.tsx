"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Item = {
  key: string;
  label: string;
  href?: string;
  icon: React.ReactNode;
  soon?: boolean;
  active?: boolean;
};

const I = {
  user: (
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
  ),
  box: (
    <path d="m21 16-9 5-9-5V8l9-5 9 5v8ZM3.3 7 12 12l8.7-5M12 22V12" />
  ),
  pin: <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
};

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

export function AccountNav({ onLogout }: { onLogout: () => void }) {
  const items: Item[] = [
    { key: "profile", label: "Hồ sơ", icon: <Icon>{I.user}</Icon>, active: true },
    { key: "orders", label: "Đơn hàng", icon: <Icon>{I.box}</Icon>, soon: true },
    { key: "address", label: "Địa chỉ", icon: <Icon>{I.pin}</Icon>, soon: true },
  ];

  const base = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition";

  return (
    <nav className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-2 lg:sticky lg:top-24">
      <ul className="space-y-1">
        {items.map((it) => {
          const inner = (
            <>
              {it.icon}
              <span className="flex-1">{it.label}</span>
              {it.soon && <span className="text-[10px] text-muted-foreground">Sắp có</span>}
            </>
          );
          return (
            <li key={it.key}>
              {it.active ? (
                <span className={cn(base, "bg-primary/10 text-primary")} aria-current="page">
                  {inner}
                </span>
              ) : it.href ? (
                <Link href={it.href} className={cn(base, "text-foreground hover:bg-muted")}>
                  {inner}
                </Link>
              ) : (
                <span className={cn(base, "cursor-default text-muted-foreground")}>{inner}</span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="my-1 border-t border-border" />
      <button
        type="button"
        onClick={onLogout}
        className={cn(base, "w-full text-destructive hover:bg-destructive/10")}
      >
        <Icon>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </Icon>
        <span className="flex-1 text-left">Đăng xuất</span>
      </button>
    </nav>
  );
}
