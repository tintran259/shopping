import { CmsSlot } from "@/cms/renderer/cms-slot";
import { getBranches } from "@/services/branch.service";
import { ProductListClient } from "./components/product-list-client";

/**
 * PLP server wrapper: renders the CMS slots (server-only) around the
 * client-rendered product list, which fetches per branch via React Query.
 * Branches are fetched here (SSR) so the client can resolve the default branch
 * synchronously on first render — avoiding a branchless → branch double fetch.
 */
export async function ProductListPage({ title, category }: { title: string; category: string }) {
  const branches = await getBranches();
  return (
    <main id="plp-top" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
      <CmsSlot slot="plp-top" />
      <ProductListClient category={category} title={title} branches={branches} />
      <CmsSlot slot="plp-bottom" />
    </main>
  );
}
