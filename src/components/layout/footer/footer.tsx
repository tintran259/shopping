import Link from "next/link";
import Image from "next/image";
import { getGlobalSeo, getFooter } from "@/cms/services/cms.service";
import type { FooterColumnVM, NavLinkItem } from "@/types/cms";
import { NewsletterForm } from "./newsletter-form";
import { socialIcon } from "./social-icons";

const SITE_NAME = "Shopping";

// Used when the CMS Footer is empty so the layout is never barren.
const FALLBACK_COLUMNS: FooterColumnVM[] = [
  {
    title: "Mua sắm",
    links: [
      { label: "Sản phẩm mới", url: "/c/new", openInNewTab: false },
      { label: "Bán chạy", url: "/c/best-sellers", openInNewTab: false },
      { label: "Khuyến mãi", url: "/c/sale", openInNewTab: false },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Liên hệ", url: "/contact", openInNewTab: false },
      { label: "Vận chuyển", url: "/shipping", openInNewTab: false },
      { label: "Đổi trả", url: "/returns", openInNewTab: false },
    ],
  },
  {
    title: "Về chúng tôi",
    links: [
      { label: "Giới thiệu", url: "/about", openInNewTab: false },
      { label: "Hệ thống cửa hàng", url: "/stores", openInNewTab: false },
    ],
  },
  {
    title: "Chính sách",
    links: [
      { label: "Bảo mật", url: "/privacy", openInNewTab: false },
      { label: "Điều khoản", url: "/terms", openInNewTab: false },
    ],
  },
];

const FALLBACK_BOTTOM: NavLinkItem[] = [
  { label: "Bảo mật", url: "/privacy", openInNewTab: false },
  { label: "Điều khoản", url: "/terms", openInNewTab: false },
];

const linkClass =
  "text-(--theme-footer-link,var(--muted-foreground)) transition hover:text-(--theme-footer-link-hover,var(--background))";

const newTab = (l: NavLinkItem) =>
  l.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {};

export async function Footer() {
  const [seo, footer] = await Promise.all([getGlobalSeo(), getFooter()]);

  const columns = footer?.columns.length ? footer.columns : FALLBACK_COLUMNS;
  const socials = footer?.socials ?? [];
  const bottomLinks = footer?.bottomLinks.length ? footer.bottomLinks : FALLBACK_BOTTOM;
  const tagline =
    footer?.tagline ||
    seo?.description ||
    "Mua sắm trực tuyến — sản phẩm chính hãng, giao nhanh toàn quốc.";
  const copyright = (footer?.copyright || "© {year} Shopping. All rights reserved.").replace(
    "{year}",
    String(new Date().getFullYear()),
  );

  return (
    <footer className="mt-16 bg-(--theme-footer-background,var(--foreground)) text-(--theme-footer-text,var(--background))">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          {/* Brand + newsletter + socials */}
          <div className="space-y-4">
            <Link href="/" aria-label={SITE_NAME} className="inline-flex items-center">
              {seo?.logo?.src ? (
                <Image
                  src={seo.logo.src}
                  alt={seo.logo.alt || SITE_NAME}
                  width={seo.logo.width ?? 120}
                  height={seo.logo.height ?? 40}
                  className="h-10 w-auto rounded-md"
                />
              ) : (
                <span className="font-heading text-xl font-bold tracking-tight">
                  {SITE_NAME}
                </span>
              )}
            </Link>
            <p className="max-w-sm text-sm text-(--theme-footer-link,var(--muted-foreground))">
              {tagline}
            </p>
            <NewsletterForm />
            {socials.length > 0 && (
              <div className="flex items-center gap-3 pt-1">
                {socials.map((s) => {
                  const Icon = socialIcon(s.platform);
                  return (
                    <a
                      key={s.platform + s.url}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.platform}
                      className={linkClass}
                    >
                      <Icon />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title} className="space-y-3">
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={`${col.title}-${l.label}`}>
                    <Link
                      href={l.url ?? "#"}
                      {...newTab(l)}
                      className={`text-sm ${linkClass}`}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-(--theme-footer-border,var(--border))">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-(--theme-footer-link,var(--muted-foreground)) sm:flex-row">
          <p>{copyright}</p>
          <div className="flex items-center gap-4">
            {bottomLinks.map((l) => (
              <Link key={l.label} href={l.url ?? "#"} {...newTab(l)} className={linkClass}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
