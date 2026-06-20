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
  | StrapiCarouselBlock
  | StrapiContentGridBlock;

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

export type ObjectFit = "cover" | "contain" | "fill" | "none" | "scale-down";

export interface StrapiCarouselBlock extends StrapiBase, Scheduled {
  __component: "blocks.carousel";
  autoplay: boolean;
  interval: number;
  loop: boolean;
  width: string | null;
  height: string | null;
  slides: StrapiSlide[];
}

export interface StrapiSlide extends StrapiBase, Scheduled {
  image: StrapiMedia | null;
  caption: string | null;
  url: string | null;
  target: "_blank" | "_self" | "_top" | "_parent" | null;
  objectFit: ObjectFit | null;
}

/** A grid card is a publishable entry with its own dynamic zone of blocks. */
export interface StrapiGridCard extends StrapiEntry, Scheduled {
  name: string;
  zone: StrapiBlock[];
}

export interface StrapiContentGridBlock extends StrapiBase, Scheduled {
  __component: "blocks.content-grid";
  desktopColumns: number;
  tabletColumns: number;
  mobileColumns: number;
  items: StrapiGridCard[];
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
/* Menu (nav.* components)                                                    */
/* -------------------------------------------------------------------------- */

/** A page relation populated with just its slug. */
type StrapiPageRef = { slug: string } | null;

/** L3 — `nav.link`. */
export interface StrapiNavLink extends StrapiBase, Scheduled {
  label: string;
  url: string | null;
  openInNewTab: boolean;
  highlight: boolean;
  image: StrapiMedia | null;
  page: StrapiPageRef;
}

/** L2 — `nav.submenu-item`. */
export interface StrapiSubmenuItem extends StrapiBase, Scheduled {
  label: string;
  url: string | null;
  openInNewTab: boolean;
  highlight: boolean;
  image: StrapiMedia | null;
  page: StrapiPageRef;
  children: StrapiNavLink[];
}

/** L1 — `nav.menu-item`. */
export interface StrapiMenuItem extends StrapiBase, Scheduled {
  label: string;
  url: string | null;
  openInNewTab: boolean;
  icon: string | null;
  highlight: boolean;
  page: StrapiPageRef;
  featuredBanner: { image: StrapiImageBlock | null } | null;
  children: StrapiSubmenuItem[];
}

export interface StrapiMenu extends StrapiEntry {
  name: string;
  handle: string;
  position: "start" | "end";
  items: StrapiMenuItem[];
}

/* -------------------------------------------------------------------------- */
/* Footer (single type)                                                       */
/* -------------------------------------------------------------------------- */

export interface StrapiFooterColumn extends StrapiBase {
  title: string;
  links: StrapiNavLink[];
}

export interface StrapiSocialLink extends StrapiBase {
  platform: string;
  url: string;
}

export interface StrapiFooter extends StrapiEntry {
  tagline: string | null;
  columns: StrapiFooterColumn[];
  socials: StrapiSocialLink[];
  copyright: string | null;
  bottomLinks: StrapiNavLink[];
}

/** A simple resolved link (url from `url` or the page relation). */
export interface NavLinkItem {
  label: string;
  url: string | null;
  openInNewTab: boolean;
}

export interface FooterColumnVM {
  title: string;
  links: NavLinkItem[];
}

export interface FooterSocialVM {
  platform: string;
  url: string;
}

export interface FooterVM {
  tagline: string | null;
  columns: FooterColumnVM[];
  socials: FooterSocialVM[];
  /** May contain a `{year}` token the storefront replaces at render. */
  copyright: string | null;
  bottomLinks: NavLinkItem[];
}

/** Normalized site settings (SEO) the storefront applies globally. */
export interface GlobalSeoVM {
  title: string | null;
  description: string | null;
  logo: MediaImage | null;
  favicon: MediaImage | null;
}

/* -------------------------------------------------------------------------- */
/* Theme (collectionType `theme`, one active row)                             */
/* -------------------------------------------------------------------------- */

/** Every `global::color` field on the CMS Theme — drives the storefront palette. */
export const THEME_COLOR_KEYS = [
  "primary", "primaryHover", "secondary", "secondaryHover", "accent",
  "pageBackground", "headerBackground", "footerBackground", "sidebarBackground",
  "cardBackground", "overlayBackground",
  "textPrimary", "textSecondary", "textMuted", "headingColor",
  "linkColor", "linkHover", "textOnPrimary",
  "headerText", "navLink", "navLinkHover",
  "announcementBarBackground", "announcementBarText",
  "cartBadgeBackground", "cartBadgeText", "searchBarBackground",
  "footerText", "footerLink", "footerLinkHover", "footerBorder",
  "btnPrimaryBg", "btnPrimaryText", "btnPrimaryHover",
  "btnSecondaryBg", "btnSecondaryText", "btnSecondaryHover", "btnDisabledBg",
  "price", "salePrice", "discountBadgeBg", "discountBadgeText", "rating",
  "inStock", "outOfStock", "wishlistColor", "freeShipBadge",
  "success", "warning", "error", "info",
  "borderColor", "divider", "selectBorder",
  "inputBackground", "inputBorder", "inputFocusBorder", "inputText", "inputPlaceholder",
  "checkboxBackground", "checkboxBorder", "checkboxIcon", "checkboxDisabled",
] as const;

export type ThemeColorKey = (typeof THEME_COLOR_KEYS)[number];

/** Raw Strapi Theme row — color custom fields are flattened scalar strings. */
export type StrapiTheme = StrapiEntry & {
  name: string;
  isActive: boolean;
} & Partial<Record<ThemeColorKey, string | null>>;

/** Normalized theme palette — only the colors that are actually set. */
export type ThemeVM = Partial<Record<ThemeColorKey, string>>;

/* -------------------------------------------------------------------------- */
/* Slots                                                                      */
/* -------------------------------------------------------------------------- */

/** Positions the CMS `content-slot.position` enum actually supports. */
export type SlotPosition =
  | "home-top"
  | "home-bottom"
  | "announcement-bar"
  | "plp-top"
  | "plp-bottom"
  | "pdp-top"
  | "pdp-content"
  | "pdp-bottom"
  | "cart-top"
  | "cart-bottom"
  | "checkout-top"
  | "checkout-bottom";

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
  | CarouselBlockVM
  | ContentGridBlockVM;

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
  /** CSS width/height for the carousel box (e.g. "100%", "auto", "400px"). */
  width: string | null;
  height: string | null;
  slides: SlideVM[];
}

export interface SlideVM {
  id: number;
  image: MediaImage | null;
  caption: string | null;
  href: string | null;
  target: string | null;
  /** How this slide's image fills its box. */
  objectFit: ObjectFit;
}

export interface BannerVM {
  id: number;
  name: string;
  description: string | null;
  image: MediaImage | null;
  blocks: Block[];
}

/** One cell of a content grid — renders its own list of blocks. */
export interface GridCardVM extends ScheduledVM {
  id: number;
  name: string;
  blocks: Block[];
}

export interface ContentGridBlockVM extends ScheduledVM {
  __component: "blocks.content-grid";
  id: number;
  desktopColumns: number;
  tabletColumns: number;
  mobileColumns: number;
  items: GridCardVM[];
}
