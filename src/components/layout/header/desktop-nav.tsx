"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "./icons";
import { NavLabel } from "./nav-label";
import type { NavNode } from "./nav-data";

/** target/rel for items that open in a new tab. */
function linkProps(n: NavNode) {
  return n.openInNewTab
    ? ({ target: "_blank", rel: "noopener noreferrer" } as const)
    : {};
}

/**
 * Flyout mega-menu for one attribute:
 *  - left  : categories (L2)
 *  - middle: items (L3) of the active category
 *  - right : image of the HOVERED node (L2 or L3), falling back up the chain
 */
function MegaPanel({
  attribute,
  onMouseEnter,
  onMouseLeave,
}: {
  attribute: NavNode;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const categories = attribute.children;
  const [activeId, setActiveId] = useState(categories[0]?.id ?? null);
  const [imageNode, setImageNode] = useState<NavNode | null>(categories[0] ?? null);

  const activeCat = categories.find((c) => c.id === activeId) ?? categories[0];
  const image =
    imageNode?.featuredImage ?? activeCat?.featuredImage ?? attribute.featuredImage ?? null;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute inset-x-0 top-full z-40 border-b bg-background shadow-lg"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(200px,240px)_1fr] gap-6 px-4 py-6 lg:grid-cols-[minmax(200px,240px)_1fr_280px]">
        {/* Left — categories (L2) */}
        <ul className="space-y-0.5 border-r pr-4">
          {categories.map((cat) => (
            <li
              key={cat.id}
              onMouseEnter={() => {
                setActiveId(cat.id);
                setImageNode(cat);
              }}
            >
              <Link
                href={cat.url ?? "#"}
                {...linkProps(cat)}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                  cat.id === activeCat?.id ? "bg-muted font-medium" : "hover:bg-muted"
                }`}
              >
                <NavLabel node={cat} />
                {cat.children.length > 0 && (
                  <ChevronRightIcon className="text-muted-foreground" />
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Middle — items (L3) of the active category */}
        <div className="min-h-40">
          {activeCat && (
            <>
              <Link
                href={activeCat.url ?? "#"}
                {...linkProps(activeCat)}
                onMouseEnter={() => setImageNode(activeCat)}
                className="text-sm font-semibold hover:underline"
              >
                <NavLabel node={activeCat} />
              </Link>
              {activeCat.children.length > 0 && (
                <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
                  {activeCat.children.map((it) => (
                    <li
                      key={it.id}
                      onMouseEnter={() => setImageNode(it)}
                      onFocus={() => setImageNode(it)}
                    >
                      <Link
                        href={it.url ?? "#"}
                        {...linkProps(it)}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        <NavLabel node={it} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {/* Right — image of the hovered node */}
        <div className="relative hidden aspect-[3/4] overflow-hidden rounded-lg bg-gradient-to-br from-muted to-muted-foreground/15 lg:block">
          {image?.src ? (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="280px"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
              {imageNode?.label ?? activeCat?.label ?? attribute.label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DesktopNav({ items }: { items: NavNode[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const open = (id: string | null) => {
    cancelClose();
    setOpenId(id);
  };
  const scheduleClose = () => {
    cancelClose();
    timer.current = setTimeout(() => setOpenId(null), 150);
  };

  const openItem = items.find((i) => i.id === openId && i.children.length > 0);

  return (
    <nav aria-label="Primary" className="hidden md:block">
      <ul className="flex items-center gap-0.5" onMouseLeave={scheduleClose}>
        {items.map((item) => {
          const hasMega = item.children.length > 0;
          return (
            <li key={item.id} onMouseEnter={() => open(hasMega ? item.id : null)}>
              <Link
                href={item.url ?? "#"}
                {...linkProps(item)}
                aria-expanded={hasMega ? openId === item.id : undefined}
                onFocus={() => open(hasMega ? item.id : null)}
                className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-(--theme-nav-link,inherit) hover:bg-muted hover:text-(--theme-nav-link-hover,inherit) aria-[expanded=true]:bg-muted"
              >
                <NavLabel node={item} dot />
                {hasMega && <ChevronDownIcon />}
              </Link>
            </li>
          );
        })}
      </ul>

      {openItem && (
        <MegaPanel
          key={openItem.id}
          attribute={openItem}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        />
      )}
    </nav>
  );
}
