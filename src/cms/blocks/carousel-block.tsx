"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import type { CarouselBlockVM, ObjectFit, SlideVM } from "@/types/cms";

const OBJECT_FIT_CLASS: Record<ObjectFit, string> = {
  cover: "object-cover",
  contain: "object-contain",
  fill: "object-fill",
  none: "object-none",
  "scale-down": "object-scale-down",
};

function SlideMedia({
  slide,
  priority,
}: {
  slide: SlideVM;
  priority: boolean;
}) {
  if (!slide.image) return null;
  // object-fit is per-slide (each image can fill its box differently).
  const fitClass = OBJECT_FIT_CLASS[slide.objectFit] ?? OBJECT_FIT_CLASS.cover;
  const media = (
    <Image
      src={slide.image.src}
      alt={slide.image.alt || slide.caption || ""}
      fill
      className={`${fitClass} select-none`}
      sizes="100vw"
      priority={priority}
      draggable={false}
    />
  );
  return slide.href ? (
    <Link href={slide.href} target={slide.target ?? undefined} className="block h-full">
      {media}
    </Link>
  ) : (
    media
  );
}

function Arrow({
  dir,
  onClick,
}: {
  dir: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={dir === "prev" ? "Previous slide" : "Next slide"}
      onClick={onClick}
      className={`absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-foreground shadow-sm backdrop-blur transition hover:bg-white ${dir === "prev" ? "left-3" : "right-3"
        }`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={dir === "prev" ? "" : "rotate-180"}
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}

export function CarouselBlock({ block }: { block: CarouselBlockVM }) {
  const slides = block.slides.filter((s) => s.image);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: block.loop, align: "start", dragFree: false },
    block.autoplay && slides.length > 1
      ? [Autoplay({ delay: block.interval || 5000, stopOnInteraction: false, stopOnMouseEnter: true })]
      : [],
  );

  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync dot state once the embla API is ready
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (slides.length === 0) return null;

  const multiple = slides.length > 1;

  // `height` ("400px", "60vh", …) sets a fixed slide height; "auto"/empty falls
  // back to a 16/7 aspect ratio (needed because the image uses `fill`).
  const fixedHeight = block.height && block.height !== "auto" ? block.height : undefined;
  // `width` ("100%", "800px", …) caps the carousel width and centers it.
  const widthStyle =
    block.width && block.width !== "100%" ? { width: block.width, maxWidth: "100%" } : undefined;

  return (
    <div
      className="relative mx-auto w-full overflow-hidden rounded-lg bg-muted"
      style={widthStyle}
    >
      {/* viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        {/* track */}
        <div className="flex touch-pan-y">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`relative min-w-0 flex-[0_0_100%] ${fixedHeight ? "" : "aspect-[16/7]"}`}
              style={fixedHeight ? { height: fixedHeight } : undefined}
            >
              <SlideMedia slide={slide} priority={i === 0} />
              {slide.caption && (
                <div className="pointer-events-none absolute bottom-0 w-full bg-gradient-to-t from-black/60 to-transparent p-4 text-sm text-white">
                  {slide.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {multiple && (
        <>
          <Arrow dir="prev" onClick={() => emblaApi?.scrollPrev()} />
          <Arrow dir="next" onClick={() => emblaApi?.scrollNext()} />

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === selected}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`h-2 rounded-full transition-all ${i === selected ? "w-5 bg-white" : "w-2 bg-white/60 hover:bg-white/80"
                  }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
