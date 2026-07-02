"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/** setTimeout overflows past ~24.8 days; longer windows are handled on reload. */
const MAX_DELAY = 2 ** 31 - 1;

function parse(v: string | null): number | null {
  if (!v) return null;
  const ms = Date.parse(v);
  return Number.isNaN(ms) ? null : ms;
}

function inWindow(now: number, start: number | null, end: number | null): boolean {
  if (start !== null && now < start) return false;
  if (end !== null && now > end) return false;
  return true;
}

/**
 * Client gate that shows its children only while `now` is inside the block's
 * [startAt, endAt] window, and flips live at the boundaries:
 *  - reveals at startAt (children are already in the payload, just hidden)
 *  - hides at endAt, then refreshes so the server drops the expired block too
 *
 * No window → always render (cheap passthrough).
 */
export function ScheduledBlock({
  startAt,
  endAt,
  children,
}: {
  startAt: string | null;
  endAt: string | null;
  children: ReactNode;
}) {
  const start = parse(startAt);
  const end = parse(endAt);
  const router = useRouter();

  const [visible, setVisible] = useState(() =>
    inWindow(Date.now(), start, end),
  );

  useEffect(() => {
    if (start === null && end === null) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- re-sync with the clock when the window props change
    setVisible(inWindow(Date.now(), start, end));

    const now = Date.now();
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (start !== null && now < start && start - now <= MAX_DELAY) {
      timers.push(
        setTimeout(() => setVisible(inWindow(Date.now(), start, end)), start - now + 100),
      );
    }
    if (end !== null && now < end && end - now <= MAX_DELAY) {
      timers.push(
        setTimeout(() => {
          setVisible(false);
          router.refresh();
        }, end - now + 100),
      );
    }

    return () => timers.forEach(clearTimeout);
  }, [start, end, router]);

  if (start === null && end === null) return <>{children}</>;
  return visible ? <>{children}</> : null;
}
