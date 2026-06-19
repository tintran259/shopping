import type { Metadata } from "next";
import { SearchResultsPage } from "@/features/search/search-results-page";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = first((await searchParams).q);
  return { title: q ? `Tìm: ${q} | Shopping` : "Tìm kiếm | Shopping" };
}

export default async function Page({ searchParams }: Props) {
  const sp = await searchParams;
  const q = first(sp.q);
  const page = Number(first(sp.page)) || 1;
  return <SearchResultsPage query={q} page={page} />;
}
