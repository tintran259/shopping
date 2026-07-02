import type { Product, ProductVariant } from "@/types/product";

/**
 * Variant-matching helpers shared by every "pick a variant" surface
 * (PDP purchase box, cart variant picker, wishlist variant picker).
 */

/** First value per option that has an in-stock variant (falls back to first value). */
export function defaultSelection(product: Product): Record<string, string> {
  return Object.fromEntries(
    product.options.map((o) => {
      const inStockVal = o.values.find((v) =>
        product.variants.some((vr) => vr.options[o.name] === v && vr.stock > 0),
      );
      return [o.name, inStockVal ?? o.values[0]];
    }),
  );
}

/** The variant whose options exactly match the current selection (if any). */
export function findVariant(
  product: Product,
  selected: Record<string, string>,
): ProductVariant | undefined {
  return product.variants.find((v) =>
    Object.entries(v.options).every(([k, val]) => selected[k] === val),
  );
}

/** A value is pickable if some in-stock variant has it + matches the other picks. */
export function isOptionValueAvailable(
  product: Product,
  selected: Record<string, string>,
  optionName: string,
  value: string,
): boolean {
  return product.variants.some(
    (v) =>
      v.stock > 0 &&
      v.options[optionName] === value &&
      Object.entries(v.options).every(([k, val]) => k === optionName || selected[k] === val),
  );
}
