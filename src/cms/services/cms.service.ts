import qs from "qs";
import { env } from "@/config/env";
import type { SlotName } from "@/cms/registry/slots";
import type {
  StrapiResponse,
  StrapiContentSlot,
  StrapiLandingPage,
  StrapiGlobalSeo,
  StrapiTheme,
  ThemeVM,
  StrapiMenu,
  StrapiMenuItem,
  StrapiSubmenuItem,
  StrapiNavLink,
  StrapiFooter,
  FooterVM,
  NavLinkItem,
} from "@/types/cms";
import { THEME_COLOR_KEYS } from "@/types/cms";
import type { NavNode } from "@/types/navigation";
import {
  transformBlocks,
  transformBanner,
} from "@/cms/transformers/cms.transformer";
import type { Block, BannerVM, GlobalSeoVM } from "@/types/cms";
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
    headers: env.strapiToken ? { Authorization: `Bearer ${env.strapiToken}` } : {},
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

/** Global SEO + theme settings (logo, favicon, title/description, brand colors). */
export async function getGlobalSeo(): Promise<GlobalSeoVM | null> {
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

/**
 * The active site theme (palette) — the single Theme row with `isActive=true`.
 * Returns only the colors that are set; null when no active theme is published.
 */
export async function getActiveTheme(): Promise<ThemeVM | null> {
  try {
    const query = buildQuery({
      filters: { isActive: { $eq: true } },
      pagination: { limit: 1 },
    });
    const json = await cmsFetch<StrapiResponse<StrapiTheme[]>>(
      `/themes?${query}`,
      ["theme"],
    );
    const theme = json.data[0];
    if (!theme) return null;

    const vm: ThemeVM = {};
    for (const key of THEME_COLOR_KEYS) {
      const value = theme[key];
      if (typeof value === "string" && value.trim()) vm[key] = value;
    }
    return vm;
  } catch (err) {
    console.error("[cms] getActiveTheme failed:", err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Footer (single type)                                                       */
/* -------------------------------------------------------------------------- */

const footerPopulate = {
  columns: { populate: { links: { populate: { page: { fields: ["slug"] } } } } },
  socials: true,
  bottomLinks: { populate: { page: { fields: ["slug"] } } },
};

function navLinkToItem(l: StrapiNavLink): NavLinkItem {
  return { label: l.label, url: resolveUrl(l.url, l.page), openInNewTab: l.openInNewTab };
}

/** The Footer single-type — columns, socials, copyright, bottom links. */
export async function getFooter(): Promise<FooterVM | null> {
  try {
    const query = buildQuery({ populate: footerPopulate });
    const json = await cmsFetch<StrapiResponse<StrapiFooter | null>>(
      `/footer?${query}`,
      ["footer"],
    );
    const f = json.data;
    if (!f) return null;
    return {
      tagline: f.tagline,
      columns: (f.columns ?? []).map((c) => ({
        title: c.title,
        links: (c.links ?? []).map(navLinkToItem),
      })),
      socials: (f.socials ?? []).map((s) => ({ platform: s.platform, url: s.url })),
      copyright: f.copyright,
      bottomLinks: (f.bottomLinks ?? []).map(navLinkToItem),
    };
  } catch (err) {
    console.error("[cms] getFooter failed:", err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Menu → unified NavNode[]                                                    */
/* -------------------------------------------------------------------------- */

const menuPopulate = {
  items: {
    populate: {
      page: { fields: ["slug"] },
      featuredBanner: { populate: { image: { populate: { image: true } } } },
      children: {
        populate: {
          page: { fields: ["slug"] },
          image: true,
          children: { populate: { page: { fields: ["slug"] }, image: true } },
        },
      },
    },
  },
};

/** Active within [startAt, endAt] (either bound optional) at `now`. */
function isActive(
  node: { startAt: string | null; endAt: string | null },
  now: number,
): boolean {
  const start = node.startAt ? Date.parse(node.startAt) : NaN;
  const end = node.endAt ? Date.parse(node.endAt) : NaN;
  if (!Number.isNaN(start) && now < start) return false;
  if (!Number.isNaN(end) && now > end) return false;
  return true;
}

/** url ?? /p/<slug> from the page relation. */
function resolveUrl(url: string | null, page: { slug: string } | null): string | null {
  if (url) return url;
  return page?.slug ? `/p/${page.slug}` : null;
}

/** A media → NavImage, or null. */
function toNavImage(media: Parameters<typeof toMediaImage>[0]) {
  const img = toMediaImage(media);
  return img ? { src: img.src, alt: img.alt } : null;
}

function navLinkToNode(link: StrapiNavLink): NavNode {
  return {
    id: `cms-l3-${link.id}`,
    label: link.label,
    url: resolveUrl(link.url, link.page),
    openInNewTab: link.openInNewTab,
    icon: null,
    highlight: link.highlight,
    featuredImage: toNavImage(link.image),
    children: [],
    source: "cms",
  };
}

function submenuToNode(sub: StrapiSubmenuItem, now: number): NavNode {
  return {
    id: `cms-l2-${sub.id}`,
    label: sub.label,
    url: resolveUrl(sub.url, sub.page),
    openInNewTab: sub.openInNewTab,
    icon: null,
    highlight: sub.highlight,
    featuredImage: toNavImage(sub.image),
    children: (sub.children ?? []).filter((c) => isActive(c, now)).map(navLinkToNode),
    source: "cms",
  };
}

function menuItemToNode(item: StrapiMenuItem, now: number): NavNode {
  return {
    id: `cms-l1-${item.id}`,
    label: item.label,
    url: resolveUrl(item.url, item.page),
    openInNewTab: item.openInNewTab,
    icon: item.icon,
    highlight: item.highlight,
    featuredImage: toNavImage(item.featuredBanner?.image?.image ?? null),
    children: (item.children ?? []).filter((c) => isActive(c, now)).map((c) => submenuToNode(c, now)),
    source: "cms",
  };
}

/**
 * CMS menu items for a position (default the primary "start" menu), normalized to
 * the unified NavNode[]. Out-of-window items/links are dropped at map time.
 */
export async function getMenuNodes(
  position: "start" | "end" = "start",
): Promise<NavNode[]> {
  try {
    const query = buildQuery({
      filters: { position: { $eq: position } },
      populate: menuPopulate,
      sort: ["createdAt:asc"],
    });
    const json = await cmsFetch<StrapiResponse<StrapiMenu[]>>(
      `/menus?${query}`,
      [`menu:${position}`],
    );
    const now = Date.now();
    return json.data.flatMap((menu) =>
      (menu.items ?? []).filter((i) => isActive(i, now)).map((i) => menuItemToNode(i, now)),
    );
  } catch (err) {
    console.error("[cms] getMenuNodes failed:", err);
    return [];
  }
}
