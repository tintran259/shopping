import { getSlotBlocks } from "@/cms/services/cms.service";
import { renderRichHtml } from "@/lib/rich-html";

// Compact, single-line styling for the bar (no `prose` — its body/link colors
// would override the theme bar colors). Links inherit the bar text color.
const LINE =
  "[&_p]:m-0 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2";

/**
 * Top announcement bar — content comes from the CMS content-slot at
 * position `announcement-bar` (a single rich-text block, authored per device).
 * Colors come from the active Theme (`--theme-announcement-bar-*`).
 * Renders nothing when the slot is empty/unpublished.
 */
export async function AnnouncementBar() {
  const blocks = await getSlotBlocks("announcement-bar");
  const block = blocks.find((b) => b.__component === "blocks.rich-text");
  const content = block?.__component === "blocks.rich-text" ? block.content : null;
  if (!content) return null;

  return (
    <div className="bg-(--theme-announcement-bar-background,var(--foreground)) text-(--theme-announcement-bar-text,var(--background))">
      <div className="mx-auto max-w-7xl px-4 py-2 text-center text-xs sm:text-sm">
        {/* per-device variants, each falling back to desktop when empty */}
        <div className={`${LINE} block md:hidden`}>
          {renderRichHtml(content.mobile || content.desktop)}
        </div>
        <div className={`${LINE} hidden md:block lg:hidden`}>
          {renderRichHtml(content.tablet || content.desktop)}
        </div>
        <div className={`${LINE} hidden lg:block`}>
          {renderRichHtml(content.desktop)}
        </div>
      </div>
    </div>
  );
}
