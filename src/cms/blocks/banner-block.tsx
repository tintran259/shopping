import Image from "next/image";
import { BlockRenderer } from "@/cms/renderer/block-renderer";
import type { BannerBlockVM } from "@/types/cms";

export function BannerBlock({ block }: { block: BannerBlockVM }) {
  const banner = block.banner;
  if (!banner) return null;

  return (
    <section className="space-y-4" aria-label={banner.name}>
      {banner.image && (
        <Image
          src={banner.image.src}
          alt={banner.image.alt || banner.name}
          width={banner.image.width ?? 1600}
          height={banner.image.height ?? 600}
          className="h-auto w-full rounded-lg object-cover"
          sizes="100vw"
        />
      )}
      {banner.blocks.length > 0 && <BlockRenderer blocks={banner.blocks} />}
    </section>
  );
}
