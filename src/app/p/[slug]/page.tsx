import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLandingPage } from "@/cms/services/cms.service";
import { BlockRenderer } from "@/cms/renderer/block-renderer";

/**
 * Fully CMS-driven landing page: slug → Strapi → Dynamic Zone → BlockRenderer.
 * The service resolves by the `slug` field, falling back to `documentId`.
 */
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLandingPage(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description ?? undefined,
  };
}

export default async function LandingPage({ params }: Params) {
  const { slug } = await params;
  const page = await getLandingPage(slug);

  if (!page) notFound();

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
      <BlockRenderer blocks={page.blocks} />
    </main>
  );
}
