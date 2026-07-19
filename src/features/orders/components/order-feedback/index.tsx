"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { env } from "@/config/env";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import type { OrderRecord, OrderRecordItem } from "@/store/order.store";
import { Button } from "@/components/ui/button";

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_IMAGES = 5;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

const QUICK_TAGS: Record<number, string[]> = {
  5: ["Chất lượng tốt", "Đúng mô tả", "Đóng gói cẩn thận", "Sẽ mua lại"],
  4: ["Hài lòng", "Đúng mô tả", "Đóng gói ổn"],
  3: ["Tạm được", "Có thể cải thiện"],
  2: ["Không như mong đợi", "Không đúng mô tả"],
  1: ["Rất thất vọng", "Hàng kém chất lượng", "Không đúng mô tả"],
};

const RATING_LABEL: Record<number, string> = {
  1: "Rất tệ",
  2: "Không hài lòng",
  3: "Bình thường",
  4: "Hài lòng",
  5: "Tuyệt vời 😊",
};

// ── Local-storage helpers ────────────────────────────────────────────────────

function hasSubmitted(orderId: string) {
  try { return !!localStorage.getItem(`feedback:${orderId}`); } catch { return false; }
}
function markSubmitted(orderId: string) {
  try { localStorage.setItem(`feedback:${orderId}`, "1"); } catch { /* ignore */ }
}

// ── Per-item state ───────────────────────────────────────────────────────────

interface ItemDraft {
  rating: number;
  tags: string[];
  comment: string;
  images: File[];
  previews: string[];
}

function emptyDraft(): ItemDraft {
  return { rating: 0, tags: [], comment: "", images: [], previews: [] };
}

// ── Star row ─────────────────────────────────────────────────────────────────

function StarRow({
  value,
  hovered,
  onRate,
  onHover,
  onLeave,
}: {
  value: number;
  hovered: number;
  onRate: (s: number) => void;
  onHover: (s: number) => void;
  onLeave: () => void;
}) {
  const active = hovered || value;
  const color = (s: number) => {
    if (s > active) return "text-muted-foreground/20";
    if (active >= 4) return "text-yellow-400";
    if (active === 3) return "text-yellow-300";
    return "text-red-400";
  };
  return (
    <div className="flex items-center gap-0.5" onMouseLeave={onLeave}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          aria-label={`${s} sao`}
          onMouseEnter={() => onHover(s)}
          onClick={() => onRate(s)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <svg
            width="28" height="28" viewBox="0 0 24 24"
            fill={s <= active ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
            className={cn("transition-colors duration-100", color(s))}
            aria-hidden
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
      {active > 0 && (
        <span className="ml-1.5 text-xs font-medium text-foreground/80">
          {RATING_LABEL[active]}
        </span>
      )}
    </div>
  );
}

// ── Image picker ─────────────────────────────────────────────────────────────

function ImagePicker({
  previews,
  onAdd,
  onRemove,
}: {
  previews: string[];
  onAdd: (files: File[]) => void;
  onRemove: (i: number) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onAdd(files);
    e.target.value = "";
  };
  return (
    <div className="flex flex-wrap gap-2">
      {previews.map((src, i) => (
        <div key={i} className="relative size-14 overflow-hidden rounded-lg ring-1 ring-border">
          <img src={src} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(i)}
            aria-label="Xóa"
            className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-foreground/70 text-background"
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      {previews.length < MAX_IMAGES && (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex size-14 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="text-[9px] font-medium">Ảnh</span>
        </button>
      )}
      <input ref={ref} type="file" accept={ACCEPT} multiple hidden onChange={handleChange} />
    </div>
  );
}

// ── Per-item feedback card ────────────────────────────────────────────────────

function ItemCard({
  item,
  draft,
  onChange,
}: {
  item: OrderRecordItem;
  draft: ItemDraft;
  onChange: (next: Partial<ItemDraft>) => void;
}) {
  const [hovered, setHovered] = useState(0);

  const handleRate = (s: number) => {
    onChange({ rating: s, tags: [] }); // reset tags on re-rate
  };

  const toggleTag = (tag: string) =>
    onChange({
      tags: draft.tags.includes(tag)
        ? draft.tags.filter((t) => t !== tag)
        : [...draft.tags, tag],
    });

  const handleAddImages = (files: File[]) => {
    const next = [...draft.images, ...files].slice(0, MAX_IMAGES);
    const previews = next.map((f) => URL.createObjectURL(f));
    onChange({ images: next, previews });
  };

  const handleRemoveImage = (i: number) => {
    URL.revokeObjectURL(draft.previews[i]);
    const next = draft.images.filter((_, idx) => idx !== i);
    const previews = next.map((f, idx) =>
      idx < draft.previews.length && idx !== i ? draft.previews[idx] : URL.createObjectURL(f),
    );
    onChange({ images: next, previews });
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background p-4">
      {/* Product info */}
      <div className="flex items-start gap-3">
        {item.image?.url ? (
          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image
              src={item.image.url}
              alt={item.image.alt ?? item.name}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground/40">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium leading-snug">{item.name}</p>
          {item.detail && (
            <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
          )}
        </div>
      </div>

      {/* Star rating */}
      <StarRow
        value={draft.rating}
        hovered={hovered}
        onRate={handleRate}
        onHover={setHovered}
        onLeave={() => setHovered(0)}
      />

      {/* Expanded form — only after rating */}
      {draft.rating > 0 && (
        <div className="space-y-3">
          {/* Quick tags */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAGS[draft.rating].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium transition",
                  draft.tags.includes(tag)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Comment */}
          <textarea
            value={draft.comment}
            onChange={(e) => onChange({ comment: e.target.value })}
            placeholder="Chia sẻ cảm nhận về sản phẩm này (không bắt buộc)…"
            rows={2}
            maxLength={500}
            className="w-full resize-none rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />

          {/* Image upload */}
          <div>
            <p className="mb-1.5 text-[11px] text-muted-foreground">
              Thêm ảnh <span className="opacity-60">(tối đa {MAX_IMAGES})</span>
            </p>
            <ImagePicker
              previews={draft.previews}
              onAdd={handleAddImages}
              onRemove={handleRemoveImage}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Upload helper ─────────────────────────────────────────────────────────────

async function uploadImages(files: File[], token: string | null): Promise<string[]> {
  if (!files.length) return [];
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const res = await fetch(`${env.apiUrl}/uploads/review-images`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) throw new Error(`upload ${res.status}`);
  const data = (await res.json()) as { urls: string[] };
  return data.urls;
}

// ── Main component ────────────────────────────────────────────────────────────

export function OrderFeedback({ order }: { order: OrderRecord }) {
  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (hasSubmitted(order.id)) setDone(true);
  }, [order.id]);

  // Cleanup object URLs on unmount.
  useEffect(() => {
    return () => {
      Object.values(drafts).forEach((d) =>
        d.previews.forEach((url) => URL.revokeObjectURL(url)),
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateDraft = (itemId: string, next: Partial<ItemDraft>) =>
    setDrafts((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] ?? emptyDraft()), ...next },
    }));

  const ratedItems = order.items.filter((it) => (drafts[it.id]?.rating ?? 0) > 0);
  const ratedCount = ratedItems.length;

  const handleSubmit = async () => {
    if (!ratedCount) return;
    setSubmitting(true);
    try {
      const token = useAuthStore.getState().token;

      // Upload images per item in parallel.
      const items = await Promise.all(
        ratedItems.map(async (it) => {
          const d = drafts[it.id]!;
          const imageUrls = await uploadImages(d.images, token);
          return {
            variantId: it.variantId ?? it.id,
            rating: d.rating,
            tags: d.tags,
            comment: d.comment.trim() || undefined,
            imageUrls,
          };
        }),
      );

      const res = await fetch(`${env.apiUrl}/orders/${order.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) console.error("[feedback] submit failed:", res.status);
    } catch (err) {
      console.error("[feedback] error:", err);
    }
    markSubmitted(order.id);
    setDone(true);
  };

  // ── Done state ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <section className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-(--theme-in-stock,#16a34a)/15 text-(--theme-in-stock,#15803d)">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <p className="font-semibold">Cảm ơn bạn đã đánh giá!</p>
          <p className="text-sm text-muted-foreground">
            Đánh giá của bạn giúp chúng tôi cải thiện chất lượng sản phẩm và dịch vụ.
          </p>
        </div>
      </section>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <section className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold">Đánh giá sản phẩm</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Mỗi sản phẩm sẽ có đánh giá riêng — bạn có thể bỏ qua những sản phẩm không muốn đánh giá.
        </p>
      </div>

      {/* Per-product cards */}
      <div className="space-y-3">
        {order.items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            draft={drafts[item.id] ?? emptyDraft()}
            onChange={(next) => updateDraft(item.id, next)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => { markSubmitted(order.id); setDone(true); }}
          className="text-xs text-muted-foreground transition hover:text-foreground"
        >
          Bỏ qua
        </button>

        <div className="flex items-center gap-2">
          {ratedCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {ratedCount}/{order.items.length} sản phẩm
            </span>
          )}
          <Button
            size="sm"
            disabled={ratedCount === 0 || submitting}
            onClick={handleSubmit}
          >
            {submitting
              ? "Đang gửi…"
              : ratedCount > 0
                ? `Gửi ${ratedCount} đánh giá`
                : "Chọn số sao để đánh giá"}
          </Button>
        </div>
      </div>
    </section>
  );
}
