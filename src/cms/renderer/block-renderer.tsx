import { ImageBlock } from "@/cms/blocks/image-block";
import { RichTextBlock } from "@/cms/blocks/rich-text-block";
import { CarouselBlock } from "@/cms/blocks/carousel-block";
import { BannerBlock } from "@/cms/blocks/banner-block";
import { ScheduledBlock } from "./scheduled-block";
import type { Block } from "@/types/cms";

/** Blocks that carry a scheduling window expose startAt/endAt; others don't. */
function schedule(block: Block): { startAt: string | null; endAt: string | null } {
  return "startAt" in block
    ? { startAt: block.startAt, endAt: block.endAt }
    : { startAt: null, endAt: null };
}

/** Type-safe dispatch of a single normalized block to its component. */
function renderBlock(block: Block) {
  switch (block.__component) {
    case "blocks.image":
      return <ImageBlock block={block} />;
    case "blocks.rich-text":
      return <RichTextBlock block={block} />;
    case "blocks.carousel":
      return <CarouselBlock block={block} />;
    case "blocks.banner":
      return <BannerBlock block={block} />;
    default: {
      // Exhaustiveness guard — a new block type must be handled above.
      const _never: never = block;
      return _never;
    }
  }
}

/**
 * Renders an ordered list of normalized CMS blocks.
 * Used by both CMS slots and fully CMS-driven landing pages.
 */
export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col gap-8">
      {blocks.map((block) => {
        const { startAt, endAt } = schedule(block);
        return (
          <ScheduledBlock
            key={`${block.__component}-${block.id}`}
            startAt={startAt}
            endAt={endAt}
          >
            {renderBlock(block)}
          </ScheduledBlock>
        );
      })}
    </div>
  );
}
