import { getSlotBlocks } from "@/cms/services/cms.service";
import { BlockRenderer } from "./block-renderer";
import type { SlotName } from "@/cms/registry/slots";

/**
 * The only sanctioned way to render CMS content inside a storefront layout.
 * Pages must never fetch the CMS directly — drop a <CmsSlot slot="..." />
 * into a predefined slot instead.
 */
export async function CmsSlot({ slot }: { slot: SlotName }) {
  const blocks = await getSlotBlocks(slot);
  if (blocks.length === 0) return null;
  return <BlockRenderer blocks={blocks} />;
}
