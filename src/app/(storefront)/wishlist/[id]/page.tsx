import type { Metadata } from "next";
import { WishlistDetailPage } from "@/features/wishlist/wishlist-detail-page";

export const metadata: Metadata = { title: "Yêu thích | Shopping" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WishlistDetailPage listId={id} />;
}
