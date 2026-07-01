"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = {
  key: string;
  label: string;
  href?: string;
  icon: React.ReactNode;
  soon?: boolean;
};

const I = {
  user: (
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
  ),
  box: <path d="m21 16-9 5-9-5V8l9-5 9 5v8ZM3.3 7 12 12l8.7-5M12 22V12" />,
  pin: <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0ZM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
};

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

/**
 * Vertical account menu — used both as the desktop sidebar and as the mobile hub
 * list on /account. `chevron` shows a › affordance (hub mode); items navigate to
 * their own full sub-pages.
 */
export function AccountNav({ onLogout, chevron = false }: { onLogout: () => void; chevron?: boolean }) {
  const pathname = usePathname();
  const items: Item[] = [
    { key: "profile", label: "Hồ sơ", href: "/account/profile", icon: <Icon>{I.user}</Icon> },
    { key: "orders", label: "Đơn hàng", href: "/account/orders", icon: <Icon>{I.box}</Icon> },
    { key: "address", label: "Địa chỉ", href: "/account/addresses", icon: <Icon>{I.pin}</Icon> },
  ];

  const base = "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition lg:py-2.5";

  const chev = chevron ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-muted-foreground">
      <path d="m9 18 6-6-6-6" />
    </svg>
  ) : null;

  return (
    <nav className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-2 lg:sticky lg:top-24">
      <ul className="space-y-1">
        {items.map((it) => {
          const active = it.href === pathname;
          const inner = (
            <>
              {it.icon}
              <span className="flex-1">{it.label}</span>
              {it.soon ? <span className="text-[10px] text-muted-foreground">Sắp có</span> : chev}
            </>
          );
          return (
            <li key={it.key}>
              {active ? (
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
