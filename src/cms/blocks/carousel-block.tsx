"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { CarouselBlockVM, SlideVM } from "@/types/cms";

function SlideMedia({ slide }: { slide: SlideVM }) {
  if (!slide.image) return null;
  const media = (
    <Image
      src={slide.image.src}
      alt={slide.image.alt || slide.caption || ""}
      fill
      className="object-cover"
      sizes="100vw"
      priority={false}
    />
  );
  return slide.href ? (
    <Link href={slide.href} target={slide.target ?? undefined}>
      {media}
    </Link>
  ) : (
    media
  );
}

export function CarouselBlock({ block }: { block: CarouselBlockVM }) {
  const slides = block.slides.filter((s) => s.image);
  const [index, setIndex] = useState(0);

  const next = useCallback(
    () => setIndex((i) => (i + 1) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (!block.autoplay || slides.length <= 1) return;
    const id = setInterval(next, block.interval || 5000);
    return () => clearInterval(id);
  }, [block.autoplay, block.interval, next, slides.length]);

  if (slides.length === 0) return null;
  const current = slides[index];

  return (
    <div className="relative aspect-[16/7] w-full overflow-hidden rounded-lg bg-muted">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0"
        >
          <SlideMedia slide={current} />
          {current.caption && (
            <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/60 to-transparent p-4 text-sm text-white">
              {current.caption}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === index ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
