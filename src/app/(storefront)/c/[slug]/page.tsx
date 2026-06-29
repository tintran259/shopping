import type { Metadata } from "next";
import { ProductListPage } from "@/features/product-list/product-list-page";
import { categoryTitle } from "@/features/product-list/utils/category-title";

/**
 * Product List Page (PLP), scoped to a category slug. Filter/sort/page + branch
 * live in the URL; the list is fetched client-side (CSR) per branch.
 */
type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${categoryTitle(slug)} | Shopping` };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  return <ProductListPage title={categoryTitle(slug)} category={slug} />;
}
