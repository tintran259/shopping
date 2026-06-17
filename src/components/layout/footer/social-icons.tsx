import type { SVGProps, FC } from "react";

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "currentColor",
};

export const FacebookIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z" />
  </svg>
);

export const InstagramIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const YoutubeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.8-1.8C19.3 5 12 5 12 5s-7.3 0-8.8.5A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.8 1.8C4.7 19 12 19 12 19s7.3 0 8.8-.5a2.5 2.5 0 0 0 1.8-1.8C23 15.2 23 12 23 12Zm-13 3V9l5.2 3-5.2 3Z" />
  </svg>
);

export const TiktokIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M16.5 3c.3 2.1 1.5 3.6 3.5 3.9v2.6c-1.3.1-2.5-.3-3.6-1v5.9c0 3-2 5.6-5.2 5.6A5.2 5.2 0 0 1 6 14.7c0-2.9 2.4-5.2 5.6-4.8v2.7c-.4-.1-.8-.2-1.2-.2-1.4 0-2.4 1-2.4 2.4 0 1.3 1 2.4 2.4 2.4 1.4 0 2.5-1.1 2.5-2.5V3h1.6Z" />
  </svg>
);

export const XIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M18.2 2h3.3l-7.2 8.3L23 22h-6.6l-5.2-6.8L5.2 22H2l7.7-8.8L1.5 2h6.8l4.7 6.2L18.2 2Zm-1.2 18h1.8L7.1 3.9H5.2L17 20Z" />
  </svg>
);

export const LinkedinIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.76-2.05C20.4 8.65 22 10.6 22 14v7h-4v-6.2c0-1.5 0-3.4-2.1-3.4s-2.4 1.6-2.4 3.3V21H9V9Z" />
  </svg>
);

export const ZaloIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <path d="M12 2C6.5 2 2 5.9 2 10.7c0 2.7 1.5 5.2 3.8 6.8-.1.9-.5 2.2-1.4 3.4-.2.3 0 .7.4.6 1.9-.4 3.3-1.2 4.2-1.8 1 .2 2 .3 3 .3 5.5 0 10-3.9 10-8.7S17.5 2 12 2Zm-4 9.9H6.4l2.2-3.1H6.5V7.7h3.8v.9L8.1 11.7h1.9v1.2H8Zm3.6 1H10.3V7.7h1.3v5.2Zm2.2.1c-.9 0-1.6-.7-1.6-1.9 0-1.1.7-1.9 1.6-1.9.4 0 .8.2 1 .5v-.4h1.2v3.6h-1.2v-.4c-.2.3-.6.5-1 .5Zm4.6-.1h-1.3V7.7H18Z" />
  </svg>
);

export const GlobeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} fill="none" stroke="currentColor" strokeWidth={1.8} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>
);

/** Map a CMS `social.platform` value to its icon (fallback: a generic globe). */
export const SOCIAL_ICONS: Record<string, FC<SVGProps<SVGSVGElement>>> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  tiktok: TiktokIcon,
  x: XIcon,
  linkedin: LinkedinIcon,
  zalo: ZaloIcon,
};

export function socialIcon(platform: string): FC<SVGProps<SVGSVGElement>> {
  return SOCIAL_ICONS[platform] ?? GlobeIcon;
}
