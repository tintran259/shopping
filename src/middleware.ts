import { NextResponse } from "next/server";

/**
 * Force the BROWSER to revalidate the document with the server on every load,
 * instead of serving its own stale copy.
 *
 * Next's ISR responses carry `Cache-Control: s-maxage=…, stale-while-revalidate=~1y`.
 * `s-maxage` is for shared caches (good — keep CDN/ISR fast), but the long SWR also
 * lets the *browser* serve a stale page on normal reload (you'd need a hard reload
 * to see edits). Overriding the browser-facing directive to `no-cache` means the
 * browser always asks the server; the server still answers from its fast ISR cache
 * (or the freshly revalidated page after a CMS edit / schedule boundary).
 *
 * We keep `s-maxage`/SWR for shared caches so server/CDN caching is unaffected.
 */
export function middleware() {
  const res = NextResponse.next();
  res.headers.set(
    "Cache-Control",
    "private, no-cache, must-revalidate, s-maxage=300, stale-while-revalidate=300",
  );
  return res;
}

export const config = {
  // Document routes only — skip assets, images, and the revalidate webhook.
  matcher: ["/", "/p/:path*"],
};
