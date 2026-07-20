"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { AccountShell } from "../account-shell";

interface ComingSoonSectionProps {
  title: string;
  description?: string;
  iconD: string;
}

export function ComingSoonSection({ title, description, iconD }: ComingSoonSectionProps) {
  return (
    <AccountShell>
      <div>
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
              aria-hidden
            >
              <path d={iconD} />
            </svg>
          </div>
          <h3 className="mt-4 text-base font-semibold">Tính năng đang được phát triển</h3>
          <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
            {description ?? "Chúng tôi đang xây dựng tính năng này. Vui lòng quay lại sau."}
          </p>
          <Link
            href="/account"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-6")}
          >
            Về trang tài khoản
          </Link>
        </div>
      </div>
    </AccountShell>
  );
}
