import type { SlotPosition } from "@/types/cms";

/**
 * Single source of truth for the predefined CMS slots.
 *
 * These mirror the `content-slot.position` enumeration in shopping-cms.
 * The CMS currently only exposes home slots; add positions here only after
 * they are added to the CMS enum, otherwise the filter will never match.
 */
export const SLOTS = [
  "home-top",
  "home-bottom",
  "announcement-bar",
  "plp-top",
  "plp-bottom",
] as const satisfies readonly SlotPosition[];

export type SlotName = (typeof SLOTS)[number];
