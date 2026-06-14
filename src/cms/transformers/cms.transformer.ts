import { env } from "@/config/env";
import type {
  StrapiMedia,
  StrapiBlock,
  StrapiBanner,
  StrapiSlide,
  Block,
  BannerVM,
  MediaImage,
  SlideVM,
  RichTextContent,
} from "@/types/cms";

/**
 * Transformers turn raw Strapi v5 payloads into the normalized view models the
 * UI renders. This is the only place that knows about Strapi's wire shape —
 * components never touch `StrapiMedia.url`, `__component` populate quirks, etc.
 */

/** Prepend the CMS host to a relative upload URL. Absolute URLs pass through. */
export function absoluteMediaUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  return `${env.strapiUrl}${url}`;
}

export function toMediaImage(media: StrapiMedia | null): MediaImage | null {
  if (!media) return null;
  return {
    src: absoluteMediaUrl(media.url),
    alt: media.alternativeText ?? "",
    width: media.width,
    height: media.height,
  };
}

/**
 * Normalize the tiptap field into per-device HTML. Accepts the responsive
 * object, a legacy plain-HTML string, or null. Empty devices fall back to
 * desktop so a desktop-only entry still renders everywhere.
 */
function toRichText(
  content: RichTextContent | string | null,
): RichTextContent | null {
  if (!content) return null;
  if (typeof content === "string") {
    return { desktop: content, tablet: content, mobile: content };
  }
  const desktop = content.desktop ?? "";
  const tablet = content.tablet || desktop;
  const mobile = content.mobile || desktop;
  if (!desktop && !tablet && !mobile) return null;
  return { desktop, tablet, mobile };
}

function toSlide(slide: StrapiSlide): SlideVM {
  return {
    id: slide.id,
    image: toMediaImage(slide.image),
    caption: slide.caption,
    href: slide.url,
    target: slide.target,
  };
}

export function transformBanner(banner: StrapiBanner): BannerVM {
  return {
    id: banner.id,
    name: banner.name,
    description: banner.description,
    image: toMediaImage(banner.image?.image ?? null),
    blocks: transformBlocks(banner.zone),
  };
}

/** Map a single dynamic-zone component to its view model. */
function transformBlock(block: StrapiBlock): Block | null {
  switch (block.__component) {
    case "blocks.image":
      return {
        __component: "blocks.image",
        id: block.id,
        href: block.url,
        target: block.target,
        image: toMediaImage(block.image),
        startAt: block.startAt,
        endAt: block.endAt,
      };
    case "blocks.rich-text":
      return {
        __component: "blocks.rich-text",
        id: block.id,
        content: toRichText(block.content),
        startAt: block.startAt,
        endAt: block.endAt,
      };
    case "blocks.banner":
      return {
        __component: "blocks.banner",
        id: block.id,
        banner: block.banner ? transformBanner(block.banner) : null,
      };
    case "blocks.carousel":
      return {
        __component: "blocks.carousel",
        id: block.id,
        autoplay: block.autoplay,
        interval: block.interval,
        loop: block.loop,
        slides: (block.slides ?? []).map(toSlide),
        startAt: block.startAt,
        endAt: block.endAt,
      };
    default:
      // Unknown component type — skip rather than crash the page.
      return null;
  }
}

/** Transform a dynamic zone, dropping unknown blocks. */
export function transformBlocks(zone: StrapiBlock[] | null): Block[] {
  if (!zone) return [];
  return zone
    .map(transformBlock)
    .filter((b): b is Block => b !== null);
}
