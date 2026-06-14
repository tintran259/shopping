/**
 * Types mirroring the `shopping-cms` Strapi v5 API.
 *
 * Two layers live here:
 *  - `Strapi*` raw types — the exact wire shape returned by Strapi (flattened
 *    in v5: no more `data.attributes`). These never reach a component.
 *  - View-model types (Block, Banner, MediaImage, …) — the normalized shape the
 *    UI consumes, produced by the transformers.
 */

/* -------------------------------------------------------------------------- */
/* Raw Strapi v5 wire types                                                   */
/* -------------------------------------------------------------------------- */

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiMediaFormat {
  url: string;
  width: number;
  height: number;
}

/** A Strapi media (upload) entry — flattened in v5. */
export interface StrapiMedia {
  id: number;
  documentId: string;
  url: string;
  alternativeText: string | null;
  width: number | null;
  height: number | null;
  mime: string;
  formats: Record<string, StrapiMediaFormat> | null;
}

/** Common fields on every entry/component. */
interface StrapiBase {
  id: number;
}

interface StrapiEntry extends StrapiBase {
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

/** Optional scheduling window present on most blocks. */
interface Scheduled {
  startAt: string | null;
  endAt: string | null;
}

/** Dynamic-zone components are discriminated by `__component`. */
export type StrapiBlock =
  | StrapiImageBlock
  | StrapiRichTextBlock
  | StrapiBannerBlock
  | StrapiCarouselBlock;

export interface StrapiImageBlock extends StrapiBase, Scheduled {
  __component: "blocks.image";
  url: string | null;
  target: "_blank" | "_self" | "_top" | "_parent" | null;
  image: StrapiMedia | null;
}

export interface StrapiRichTextBlock extends StrapiBase, Scheduled {
  __component: "blocks.rich-text";
  /**
   * `global::tiptap` custom field. Stored as responsive HTML per device
   * (`editor.getHTML()`), or a legacy plain-HTML string, or null when empty.
   */
  content: RichTextContent | string | null;
}

/** Per-device HTML produced by the CMS tiptap editor. */
export interface RichTextContent {
  desktop: string;
  tablet: string;
  mobile: string;
}

export interface StrapiBannerBlock extends StrapiBase {
  __component: "blocks.banner";
  banner: StrapiBanner | null;
}

export interface StrapiCarouselBlock extends StrapiBase, Scheduled {
  __component: "blocks.carousel";
  autoplay: boolean;
  interval: number;
  loop: boolean;
  slides: StrapiSlide[];
}

export interface StrapiSlide extends StrapiBase, Scheduled {
  image: StrapiMedia | null;
  caption: string | null;
  url: string | null;
  target: "_blank" | "_self" | "_top" | "_parent" | null;
}

export interface StrapiBanner extends StrapiEntry, Scheduled {
  name: string;
  description: string | null;
  image: StrapiImageBlock | null;
  zone: StrapiBlock[];
}

export interface StrapiContentSlot extends StrapiEntry {
  name: string;
  position: SlotPosition | null;
  description: string | null;
  zone: StrapiBlock[];
}

export interface StrapiLandingPage extends StrapiEntry {
  title: string;
  slug: string;
  description: string | null;
  zone: StrapiBlock[];
}

export interface StrapiGlobalSeo extends StrapiEntry {
  title: string | null;
  description: string | null;
  logo: StrapiMedia | null;
  favicon: StrapiMedia | null;
}

/* -------------------------------------------------------------------------- */
/* Slots                                                                      */
/* -------------------------------------------------------------------------- */

/** Positions the CMS `content-slot.position` enum actually supports. */
export type SlotPosition = "home-top" | "home-bottom";

/* -------------------------------------------------------------------------- */
/* Normalized view models (what the UI renders)                               */
/* -------------------------------------------------------------------------- */

export interface MediaImage {
  /** Absolute URL (CMS host prepended). */
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
}

export type Block =
  | ImageBlockVM
  | RichTextBlockVM
  | BannerBlockVM
  | CarouselBlockVM;

/**
 * Scheduling window forwarded to the client so blocks can appear/disappear live
 * at startAt/endAt without a reload. The CMS already removes blocks whose endAt
 * has passed; these carry the *active/upcoming* window for the client gate.
 */
export interface ScheduledVM {
  startAt: string | null;
  endAt: string | null;
}

export interface ImageBlockVM extends ScheduledVM {
  __component: "blocks.image";
  id: number;
  href: string | null;
  target: string | null;
  image: MediaImage | null;
}

export interface RichTextBlockVM extends ScheduledVM {
  __component: "blocks.rich-text";
  id: number;
  /** Normalized per-device HTML; empty devices fall back to desktop. */
  content: RichTextContent | null;
}

export interface BannerBlockVM {
  __component: "blocks.banner";
  id: number;
  banner: BannerVM | null;
}

export interface CarouselBlockVM extends ScheduledVM {
  __component: "blocks.carousel";
  id: number;
  autoplay: boolean;
  interval: number;
  loop: boolean;
  slides: SlideVM[];
}

export interface SlideVM {
  id: number;
  image: MediaImage | null;
  caption: string | null;
  href: string | null;
  target: string | null;
}

export interface BannerVM {
  id: number;
  name: string;
  description: string | null;
  image: MediaImage | null;
  blocks: Block[];
}
