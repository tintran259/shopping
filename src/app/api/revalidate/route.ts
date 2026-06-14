import { revalidateTag, revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { CMS_TAG } from "@/cms/services/cms.service";

/**
 * On-demand revalidation webhook called by shopping-cms:
 *  - editorial changes        → lifecycle hooks (per-slot / per-entry tags)
 *  - startAt/endAt boundaries  → schedule cron (tags it should refresh)
 *
 * Authenticated with a shared secret in the `x-revalidate-secret` header.
 * Body: `{ "tags": ["slot:home-top", "landing:summer", ...] }`.
 *
 * We invalidate BOTH layers:
 *  - `revalidateTag` → the tagged Data Cache (the fetched CMS JSON)
 *  - `revalidatePath` → the prerendered route HTML (static/ISR pages won't
 *    regenerate from a tag invalidation alone)
 */

/** Map CMS cache tags to the storefront routes that render them. */
function pathsForTags(tags: string[]): Array<[string, "page" | "layout"]> {
  const paths = new Map<string, "page" | "layout">();
  let broad = false;

  for (const tag of tags) {
    if (tag.startsWith("slot:")) {
      paths.set("/", "page"); // all slots render on the home page
    } else if (tag.startsWith("landing:")) {
      paths.set(`/p/${tag.slice("landing:".length)}`, "page");
    } else {
      // cms (catch-all), banner:*, global-seo → could affect any page
      broad = true;
    }
  }

  if (broad || paths.size === 0) return [["/", "layout"]]; // revalidate everything
  return [...paths.entries()];
}

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json(
      { revalidated: false, error: "invalid secret" },
      { status: 401 },
    );
  }

  let tags: string[] = [];
  let reason = "";
  try {
    const body = await req.json();
    if (Array.isArray(body?.tags)) {
      tags = body.tags.filter((t: unknown): t is string => typeof t === "string");
    }
    if (typeof body?.reason === "string") reason = body.reason;
  } catch {
    // empty/invalid body → fall back to the catch-all below
  }

  // Data Cache (tagged).
  const tagSet = new Set<string>([CMS_TAG, ...tags]);
  for (const tag of tagSet) revalidateTag(tag, "max");

  // Route HTML (prerendered pages).
  const paths = pathsForTags(tags);
  for (const [path, type] of paths) revalidatePath(path, type);

  return NextResponse.json({
    revalidated: true,
    tags: [...tagSet],
    paths,
    reason,
    now: Date.now(),
  });
}
