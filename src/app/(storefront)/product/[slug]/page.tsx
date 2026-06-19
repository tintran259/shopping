import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/services/product.service";
import { ProductDetailPage } from "@/features/product-detail/product-detail-page";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const title = `${product.seo?.title ?? product.name} | Shopping`;
  const description = product.seo?.description ?? product.shortDescription;
  const image = product.images.find((img) => img.url)?.url;
  const canonical = `/product/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return <ProductDetailPage product={product} />;
}
