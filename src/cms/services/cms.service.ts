import qs from "qs";
import { env } from "@/config/env";
import type { SlotName } from "@/cms/registry/slots";
import type {
  StrapiResponse,
  StrapiContentSlot,
  StrapiLandingPage,
  StrapiGlobalSeo,
} from "@/types/cms";
import {
  transformBlocks,
  transformBanner,
} from "@/cms/transformers/cms.transformer";
import type { Block, BannerVM, MediaImage } from "@/types/cms";
import { toMediaImage } from "@/cms/transformers/cms.transformer";

/* -------------------------------------------------------------------------- */
/* Populate config — mirrors the nested structure of the dynamic zones.       */
/* -------------------------------------------------------------------------- */

const carouselPopulate = {
  populate: { slides: { populate: { image: true } } },
};

const bannerBlockPopulate = {
  populate: {
    banner: {
      populate: {
        image: { populate: { image: true } },
        zone: {
          on: {
            "blocks.rich-text": true,
            "blocks.carousel": carouselPopulate,
          },
        },
      },
    },
  },
};

// The leaf blocks that can appear in any dynamic zone (also reused for the zone
// inside each grid-card). content-grid is NOT here — grid-cards can't nest grids.
const baseBlockOn = {
  "blocks.image": { populate: { image: true } },
  "blocks.rich-text": true,
  "blocks.carousel": carouselPopulate,
  "blocks.banner": bannerBlockPopulate,
};

// content-grid → items (grid-cards) → each card's zone of leaf blocks.
const contentGridPopulate = {
  populate: { items: { populate: { zone: { on: baseBlockOn } } } },
};

const zoneOn = {
  ...baseBlockOn,
  "blocks.content-grid": contentGridPopulate,
};

const zonePopulate = { zone: { on: zoneOn } };

function buildQuery(query: Record<string, unknown>): string {
  return qs.stringify(query, { encodeValuesOnly: true });
}

/* -------------------------------------------------------------------------- */
/* Caching                                                                     */
/* -------------------------------------------------------------------------- */

/** Catch-all tag — every CMS read carries it, so a single revalidate refreshes all. */
export const CMS_TAG = "cms";

/**
 * Safety-net TTL for the tagged Data Cache. Precise freshness comes from
 * on-demand `revalidateTag` (CMS lifecycle hooks for edits + the schedule cron
 * for startAt/endAt boundaries, via /api/revalidate). This TTL only bounds how
 * long a *missed* invalidation can serve stale.
 */
const CMS_TTL_SECONDS = 300;

/* -------------------------------------------------------------------------- */
/* Fetch (Next.js Data Cache, tagged for on-demand revalidation)              */
/* -------------------------------------------------------------------------- */

async function cmsFetch<T>(path: string, tags: string[]): Promise<T> {
  const res = await fetch(`${env.strapiUrl}/api${path}`, {
    headers: env.strapiToken
      ? { Authorization: `Bearer ${env.strapiToken}` }
      : {},
    next: { tags: [CMS_TAG, ...tags], revalidate: CMS_TTL_SECONDS },
  });

  if (!res.ok) {
    throw new Error(`CMS request failed (${res.status}): ${path}`);
  }

  return res.json() as Promise<T>;
}

/* -------------------------------------------------------------------------- */
/* Public API — returns normalized view models, never raw Strapi payloads.    */
/* -------------------------------------------------------------------------- */

/**
 * Blocks assigned to a storefront slot (by `content-slot.position`).
 * Multiple content-slot entries may share a position — their zones are
 * concatenated. Tagged `slot:<position>` for surgical revalidation.
 */
export async function getSlotBlocks(slot: SlotName): Promise<Block[]> {
  try {
    const query = buildQuery({
      filters: { position: { $eq: slot } },
      populate: zonePopulate,
      sort: ["createdAt:asc"],
    });
    const json = await cmsFetch<StrapiResponse<StrapiContentSlot[]>>(
      `/content-slots?${query}`,
      [`slot:${slot}`],
    );
    return json.data.flatMap((entry) => transformBlocks(entry.zone));
  } catch (err) {
    // CMS is an enhancement layer — never break the storefront if it is down.
    console.error("[cms] getSlotBlocks failed:", err);
    return [];
  }
}

type LandingPageVM = {
  title: string;
  description: string | null;
  blocks: Block[];
};

function toLandingPageVM(page: StrapiLandingPage): LandingPageVM {
  return {
    title: page.title,
    description: page.description,
    blocks: transformBlocks(page.zone),
  };
}

/**
 * A fully CMS-driven landing page, resolved by its human-readable `slug`.
 * Falls back to a `documentId` lookup so older/opaque links keep working.
 */
export async function getLandingPage(
  slug: string,
): Promise<LandingPageVM | null> {
  const tags = [`landing:${slug}`];
  try {
    // Primary: match the slug field.
    const listQuery = buildQuery({
      filters: { slug: { $eq: slug } },
      populate: zonePopulate,
      pagination: { limit: 1 },
    });
    const list = await cmsFetch<StrapiResponse<StrapiLandingPage[]>>(
      `/landing-pages?${listQuery}`,
      tags,
    );
    if (list.data[0]) return toLandingPageVM(list.data[0]);

    // Fallback: treat the param as a documentId.
    const oneQuery = buildQuery({ populate: zonePopulate });
    const one = await cmsFetch<StrapiResponse<StrapiLandingPage | null>>(
      `/landing-pages/${slug}?${oneQuery}`,
      tags,
    );
    return one.data ? toLandingPageVM(one.data) : null;
  } catch (err) {
    console.error("[cms] getLandingPage failed:", err);
    return null;
  }
}

/** A single banner by documentId (normalized). */
export async function getBanner(documentId: string): Promise<BannerVM | null> {
  try {
    const query = buildQuery({
      populate: {
        image: { populate: { image: true } },
        zone: {
          on: {
            "blocks.rich-text": true,
            "blocks.carousel": carouselPopulate,
          },
        },
      },
    });
    const json = await cmsFetch<
      StrapiResponse<Parameters<typeof transformBanner>[0]>
    >(`/banners/${documentId}?${query}`, [`banner:${documentId}`]);
    return json.data ? transformBanner(json.data) : null;
  } catch (err) {
    console.error("[cms] getBanner failed:", err);
    return null;
  }
}

/** Global SEO/site settings (logo, favicon, default title/description). */
export async function getGlobalSeo(): Promise<{
  title: string | null;
  description: string | null;
  logo: MediaImage | null;
  favicon: MediaImage | null;
} | null> {
  try {
    const query = buildQuery({ populate: { logo: true, favicon: true } });
    const json = await cmsFetch<StrapiResponse<StrapiGlobalSeo | null>>(
      `/global-seo-setting?${query}`,
      ["global-seo"],
    );
    if (!json.data) return null;
    return {
      title: json.data.title,
      description: json.data.description,
      logo: toMediaImage(json.data.logo),
      favicon: toMediaImage(json.data.favicon),
    };
  } catch (err) {
    console.error("[cms] getGlobalSeo failed:", err);
    return null;
  }
}
