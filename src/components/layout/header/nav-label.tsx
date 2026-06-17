import type { NavNode } from "./nav-data";

/**
 * Renders a nav label. When the node is highlighted it gets an animated
 * shimmering gradient (and an optional pulsing dot, used at the top level).
 * The shimmer wraps ONLY the text so sibling icons keep their normal color.
 */
export function NavLabel({ node, dot = false }: { node: NavNode; dot?: boolean }) {
  if (!node.highlight) return <>{node.label}</>;

  return (
    <span className="inline-flex items-center gap-1.5">
      {dot && (
        <span
          aria-hidden
          className="nav-highlight-dot inline-block size-1.5 shrink-0 rounded-full bg-rose-500"
        />
      )}
      <span className="nav-highlight">{node.label}</span>
    </span>
  );
}
