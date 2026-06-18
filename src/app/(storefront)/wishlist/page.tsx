import type { Metadata } from "next";
import { WishlistPage } from "@/features/wishlist/wishlist-page";

export const metadata: Metadata = { title: "Yêu thích | Shopping" };

export default function Page() {
  return <WishlistPage />;
}
