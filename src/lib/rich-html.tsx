import parse, {
  Element,
  type HTMLReactParserOptions,
} from "html-react-parser";
import Image from "next/image";
import { env } from "@/config/env";
import { absoluteMediaUrl } from "@/cms/transformers/cms.transformer";

/**
 * Renders trusted CMS HTML (tiptap output) to React, upgrading `<img>` tags to
 * next/image for optimization. Images served by the Strapi host (or relative
 * URLs that resolve to it) are optimized; images on other hosts are left as
 * plain `<img>` so they don't trip next/image's allowed-hosts check.
 */

const strapiHost = (() => {
  try {
    return new URL(env.strapiUrl).host;
  } catch {
    return "";
  }
})();

/** Whether next/image is allowed to optimize this (already-absolute) URL. */
function isOptimizable(url: string): boolean {
  try {
    return new URL(url).host === strapiHost;
  } catch {
    return false;
  }
}

const options: HTMLReactParserOptions = {
  replace: (node) => {
    if (!(node instanceof Element) || node.name !== "img") return;

    const { src, alt, width, height } = node.attribs;
    if (!src) return null;

    const url = absoluteMediaUrl(src);
    if (!isOptimizable(url)) return; // keep the original <img>

    const w = Number(width);
    const h = Number(height);

    // When the editor records real dimensions, honor them; otherwise use the
    // responsive "unknown size" pattern (width/height 0 + sizes + CSS).
    if (w > 0 && h > 0) {
      return (
        <Image
          src={url}
          alt={alt ?? ""}
          width={w}
          height={h}
          className="h-auto max-w-full rounded-lg"
        />
      );
    }

    return (
      <Image
        src={url}
        alt={alt ?? ""}
        width={0}
        height={0}
        sizes="100vw"
        className="h-auto w-full rounded-lg"
      />
    );
  },
};

export function renderRichHtml(html: string) {
  if (!html) return null;
  return parse(html, options);
}
