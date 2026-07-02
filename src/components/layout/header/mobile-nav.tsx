"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MenuIcon, CloseIcon, ChevronDownIcon } from "./icons";
import { SearchBar } from "./search-bar";
import { NavLabel } from "./nav-label";
import type { NavNode } from "./nav-data";

function linkProps(n: NavNode) {
  return n.openInNewTab
    ? ({ target: "_blank", rel: "noopener noreferrer" } as const)
    : {};
}

function MobileItem({
  node,
  depth,
  onNavigate,
}: {
  node: NavNode;
  depth: number;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const pad = { paddingLeft: 12 + depth * 12 };

  if (node.children.length === 0) {
    return (
      <Link
        href={node.url ?? "#"}
        {...linkProps(node)}
        onClick={onNavigate}
        style={pad}
        className="block rounded-md py-2 pr-3 text-sm text-(--theme-nav-link,inherit) hover:bg-muted hover:text-(--theme-nav-link-hover,inherit)"
      >
        <NavLabel node={node} dot={depth === 0} />
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        style={pad}
        className="flex w-full items-center justify-between rounded-md py-2 pr-3 text-sm font-medium text-(--theme-nav-link,inherit) hover:bg-muted hover:text-(--theme-nav-link-hover,inherit)"
      >
        <span>
          <NavLabel node={node} dot={depth === 0} />
        </span>
        <ChevronDownIcon className={`transition ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div>
          {node.url && (
            <Link
              href={node.url}
              {...linkProps(node)}
              onClick={onNavigate}
              style={{ paddingLeft: 12 + (depth + 1) * 12 }}
              className="block py-1.5 pr-3 text-sm text-muted-foreground hover:text-foreground"
            >
              Xem tất cả
            </Link>
          )}
          {node.children.map((c) => (
            <MobileItem key={c.id} node={c} depth={depth + 1} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MobileNav({ items }: { items: NavNode[] }) {
  const [open, setOpen] = useState(false);

  // Client mount gate — the portal below touches `document`, which doesn't
  // exist while the page is prerendered on the server.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client mount gate
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Mở menu"
        onClick={() => setOpen(true)}
        className="inline-flex size-9 items-center justify-center rounded-md hover:bg-muted md:hidden"
      >
        <MenuIcon />
      </button>

      {/* Portal to <body> so `fixed` escapes the header's backdrop-filter
          containing block (otherwise the drawer is clipped to the header). */}
      {mounted &&
        createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-60"
              initial="closed"
              animate="open"
              exit="closed"
            >
              <motion.button
                type="button"
                aria-label="Đóng menu"
                className="absolute inset-0 bg-black/40"
                onClick={() => setOpen(false)}
                variants={{ open: { opacity: 1 }, closed: { opacity: 0 } }}
                transition={{ duration: 0.2 }}
              />
              <motion.div
                className="absolute inset-y-0 left-0 flex w-80 max-w-[85%] flex-col bg-background shadow-xl"
                variants={{ open: { x: 0 }, closed: { x: "-100%" } }}
                transition={{ type: "tween", ease: "easeOut", duration: 0.28 }}
              >
                <div className="flex items-center justify-between border-b p-4">
                  <span className="font-heading text-lg font-semibold">Menu</span>
                  <button
                    type="button"
                    aria-label="Đóng menu"
                    onClick={() => setOpen(false)}
                    className="inline-flex size-9 items-center justify-center rounded-md hover:bg-muted"
                  >
                    <CloseIcon />
                  </button>
                </div>
                <div className="border-b p-4">
                  <SearchBar className="w-full" />
                </div>
                <nav aria-label="Mobile" className="flex-1 overflow-y-auto p-2">
                  {items.map((item) => (
                    <MobileItem
                      key={item.id}
                      node={item}
                      depth={0}
                      onNavigate={() => setOpen(false)}
                    />
                  ))}
                </nav>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
