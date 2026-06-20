import Link from "next/link";
import Image from "next/image";
import { AnnouncementBar } from "./announcement-bar";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";
import { SearchBar } from "./search-bar";
import { CartButton } from "./cart-button";
import { WishlistButton } from "./wishlist-button";
import { BranchSelector } from "./branch-selector";
import { AccountMenu } from "./account-menu";
import { getGlobalSeo } from "@/cms/services/cms.service";
import { getNavigation } from "@/services/navigation";
import { getBranches } from "@/services/branch.service";

const SITE_NAME = "Shopping";

export async function Header() {
  // CMS menu + BE category tree, merged into the unified NavNode[].
  const [nav, seo, branches] = await Promise.all([
    getNavigation(),
    getGlobalSeo(),
    getBranches(),
  ]);

  return (
    <header className="sticky top-0 z-50 text-(--theme-header-text,var(--foreground)) bg-[color-mix(in_srgb,var(--theme-header-background,var(--background))_92%,transparent)] backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--theme-header-background,var(--background))_80%,transparent)]">
      <AnnouncementBar />

      {/* Row 1 — logo · search · branch + actions */}
      <div className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          {/* left: mobile menu + logo */}
          <div className="flex items-center gap-1">
            <MobileNav items={nav} />
            <Link href="/" aria-label={SITE_NAME} className="flex items-center">
              {seo?.logo?.src ? (
                <Image
                  src={seo.logo.src}
                  alt={seo.logo.alt || SITE_NAME}
                  width={seo.logo.width ?? 120}
                  height={seo.logo.height ?? 40}
                  className="h-12 w-auto rounded-lg"
                  priority
                />
              ) : (
                <span className="font-heading text-xl font-bold tracking-tight">
                  {SITE_NAME}
                </span>
              )}
            </Link>
          </div>

          {/* center: search (grows to fill the freed-up space) */}
          <div className="flex flex-1 justify-center">
            <SearchBar className="hidden w-full max-w-xl md:flex" />
          </div>

          {/* right: branch + actions */}
          <div className="flex items-center gap-0.5">
            <BranchSelector branches={branches} />
            <AccountMenu />
            <WishlistButton />
            <CartButton />
          </div>
        </div>
      </div>

      {/* Row 2 — navigation bar (desktop). `relative` anchors the mega-menu;
          hidden on mobile where the drawer handles nav. */}
      <div className="relative hidden border-b md:block">
        <div className="mx-auto flex h-12 max-w-7xl items-center px-4">
          <DesktopNav items={nav} />
        </div>
      </div>
    </header>
  );
}
