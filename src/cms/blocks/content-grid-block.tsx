import { BlockRenderer } from "@/cms/renderer/block-renderer";
import { ScheduledBlock } from "@/cms/renderer/scheduled-block";
import type { ContentGridBlockVM } from "@/types/cms";

/**
 * Responsive grid of grid-cards. Column counts per breakpoint come from the CMS
 * and are passed as CSS variables consumed by the `.cms-content-grid` rule in
 * globals.css (arbitrary 1–12 columns can't be Tailwind classes at runtime).
 * Each card renders its own blocks and is gated by its own schedule.
 */
export function ContentGridBlock({ block }: { block: ContentGridBlockVM }) {
  if (block.items.length === 0) return null;

  const style = {
    "--grid-cols-mobile": String(block.mobileColumns),
    "--grid-cols-tablet": String(block.tabletColumns),
    "--grid-cols-desktop": String(block.desktopColumns),
  } as React.CSSProperties;

  return (
    <div className="cms-content-grid" style={style}>
      {block.items.map((card) => (
        <ScheduledBlock key={card.id} startAt={card.startAt} endAt={card.endAt}>
          <BlockRenderer blocks={card.blocks} />
        </ScheduledBlock>
      ))}
    </div>
  );
}
