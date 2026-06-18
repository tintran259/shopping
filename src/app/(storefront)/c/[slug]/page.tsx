import type { Metadata } from "next";
import { ProductListPage } from "@/features/product-list/product-list-page";
import { parseProductParams, type RawSearchParams } from "@/features/product-list/utils/search-params";
import { categoryTitle } from "@/features/product-list/utils/category-title";

/**
 * Product List Page (PLP), scoped to a category slug. All filter/sort/pagination
 * state lives in the URL searchParams (parsed server-side), so the page is
 * shareable and the route's loading.tsx skeleton shows on every navigation.
 */
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${categoryTitle(slug)} | Shopping` };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const parsed = parseProductParams(sp, slug);

  return <ProductListPage title={categoryTitle(slug)} params={parsed} />;
}
