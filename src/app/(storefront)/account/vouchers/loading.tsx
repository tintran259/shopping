import { AccountSkeletonShell } from "@/features/account/components/account-skeleton-shell";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <AccountSkeletonShell>
        <div className="space-y-4">
          <div className="h-6 w-44 animate-pulse rounded-lg bg-muted" />
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 gap-4">
            <div className="size-14 animate-pulse rounded-full bg-muted" />
            <div className="space-y-2 text-center">
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="h-3 w-64 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-8 w-36 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </AccountSkeletonShell>
    </main>
  );
}
