/** Map a swatch value (color name) to a CSS color. Extend as the palette grows. */
const COLOR_HEX: Record<string, string> = {
  Đen: "#1a1a1a",
  Trắng: "#f5f5f5",
  Xanh: "#3b82f6",
  Đỏ: "#ef4444",
  Be: "#d8c3a5",
};

export function colorHex(value: string): string {
  return COLOR_HEX[value] ?? "#cccccc";
}
