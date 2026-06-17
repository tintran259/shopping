import type { CSSProperties } from "react";
import type { ThemeVM, ThemeColorKey } from "@/types/cms";

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/**
 * Bridge CMS theme colors onto the shadcn/Tailwind tokens already used across
 * the UI, so existing `bg-primary`, `text-muted-foreground`, `border-border`,
 * … recolor automatically without touching every component. Conservative on
 * purpose — only tokens with a clear semantic match are bridged.
 */
const TOKEN_BRIDGE: Record<string, ThemeColorKey> = {
  "--background": "pageBackground",
  "--foreground": "textPrimary",
  "--card": "cardBackground",
  "--card-foreground": "textPrimary",
  "--popover": "cardBackground",
  "--popover-foreground": "textPrimary",
  "--primary": "primary",
  "--primary-foreground": "textOnPrimary",
  "--secondary": "secondary",
  "--secondary-foreground": "textOnPrimary",
  "--muted": "searchBarBackground",
  "--muted-foreground": "textMuted",
  "--accent": "searchBarBackground",
  "--accent-foreground": "textPrimary",
  "--border": "borderColor",
  "--input": "inputBorder",
  "--ring": "inputFocusBorder",
  "--destructive": "error",
};

/**
 * Map an active theme to inline CSS custom properties for `<html>`. Emits:
 *  - `--theme-<kebab-key>` for the FULL palette (header/footer/badges/price/…),
 *    so any component can opt into a specific brand color.
 *  - bridged core tokens (above) so the current shadcn-based UI recolors now.
 * Inline vars on `:root` (the html element) override globals.css defaults.
 */
export function themeToCssVars(theme: ThemeVM): CSSProperties {
  const vars: Record<string, string> = {};

  for (const [key, value] of Object.entries(theme)) {
    if (value) vars[`--theme-${kebab(key)}`] = value;
  }

  for (const [token, key] of Object.entries(TOKEN_BRIDGE)) {
    const value = theme[key];
    if (value) vars[token] = value;
  }

  return vars as CSSProperties;
}
