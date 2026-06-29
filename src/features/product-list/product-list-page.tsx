import { CmsSlot } from "@/cms/renderer/cms-slot";
import { ProductListClient } from "./components/product-list-client";

/**
 * PLP server wrapper: renders the CMS slots (server-only) around the
 * client-rendered product list, which fetches per branch via React Query.
 */
export function ProductListPage({ title, category }: { title: string; category: string }) {
  return (
    <main id="plp-top" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <CmsSlot slot="plp-top" />
      <ProductListClient category={category} title={title} />
      <CmsSlot slot="plp-bottom" />
    </main>
  );
}
