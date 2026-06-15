import type { Block } from "@/types/cms";

/**
 * Allow-list of CMS dynamic-zone components the storefront knows how to render.
 * These are presentational content blocks only — never commerce logic
 * (product list, search, filter, cart, checkout, customer).
 *
 * Rendering itself lives in the type-safe switch in `block-renderer.tsx`.
 */
export const ALLOWED_BLOCKS = [
  "blocks.image",
  "blocks.rich-text",
  "blocks.carousel",
  "blocks.banner",
  "blocks.content-grid",
] as const satisfies readonly Block["__component"][];
