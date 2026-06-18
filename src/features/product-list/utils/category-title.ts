/**
 * Human title for a category slug. Until the BE category API is wired, known
 * slugs are mapped here and anything else is prettified from the slug.
 */
const KNOWN: Record<string, string> = {
  // Fashion
  "ao-thun": "Áo thun",
  giay: "Giày",
  // Souvenir
  "qua-luu-niem": "Quà lưu niệm",
  // Specialty (đặc sản)
  "dac-san": "Đặc sản",
  // Marketing collections
  new: "Hàng mới về",
  "best-sellers": "Bán chạy nhất",
  sale: "Khuyến mãi",
};

export function categoryTitle(slug: string): string {
  if (KNOWN[slug]) return KNOWN[slug];
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
