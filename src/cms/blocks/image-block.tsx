import Image from "next/image";
import Link from "next/link";
import type { ImageBlockVM } from "@/types/cms";

export function ImageBlock({ block }: { block: ImageBlockVM }) {
  const { image, href, target } = block;
  if (!image) return null;

  const img = (
    <Image
      src={image.src}
      alt={image.alt}
      width={image.width ?? 1600}
      height={image.height ?? 900}
      className="h-auto w-full rounded-lg object-cover"
      sizes="100vw"
    />
  );

  if (!href) return <div className="w-full">{img}</div>;

  return (
    <Link href={href} target={target ?? undefined} className="block w-full">
      {img}
    </Link>
  );
}
