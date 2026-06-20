import type { ProductSummary } from "@/types/product";
import type { CartLine } from "@/store/cart.store";

/** Variant-axis preview → a one-line label, e.g. "Quy cách: 200g · 500g". */
function summaryDetail(p: ProductSummary): string | undefined {
  if (!p.optionPreview) return undefined;
  return `${p.optionPreview.name}: ${p.optionPreview.values.slice(0, 4).join(" · ")}`;
}

/**
 * Build a cart line from a PLP/wishlist card summary (no variant chosen).
 * `branchId` (when known) sets the stock cap from that branch's quantity.
 */
export function cartLineFromSummary(
  p: ProductSummary,
  quantity = 1,
  branchId?: string,
): CartLine {
  const entry = branchId ? p.branchStock?.find((b) => b.branchId === branchId) : undefined;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    image: p.thumbnail,
    brand: p.brand?.name,
    detail: summaryDetail(p),
    price: p.price.amount,
    compareAt: p.price.compareAt,
    currency: p.price.currency,
    quantity,
    maxStock: entry?.quantity ?? 99,
    branchStock: p.branchStock,
    rating: p.rating,
  };
}
