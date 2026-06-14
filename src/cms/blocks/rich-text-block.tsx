import { renderRichHtml } from "@/lib/rich-html";
import type { RichTextBlockVM } from "@/types/cms";

/**
 * Renders the CMS tiptap field. Content is trusted HTML authored in Strapi,
 * stored per device. We render all three variants and toggle them by Tailwind
 * breakpoint so each device gets its own markup without client JS.
 *
 * HTML is parsed (not dangerouslySetInnerHTML) so embedded `<img>` tags are
 * upgraded to next/image — see `renderRichHtml`.
 */
export function RichTextBlock({ block }: { block: RichTextBlockVM }) {
  const content = block.content;
  if (!content) return null;

  const base = "prose prose-neutral max-w-none dark:prose-invert";

  return (
    <>
      <div className={`${base} block md:hidden`}>
        {renderRichHtml(content.mobile)}
      </div>
      <div className={`${base} hidden md:block lg:hidden`}>
        {renderRichHtml(content.tablet)}
      </div>
      <div className={`${base} hidden lg:block`}>
        {renderRichHtml(content.desktop)}
      </div>
    </>
  );
}
