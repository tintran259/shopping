"use client";

import { cn } from "@/lib/utils";
import { colorHex } from "@/features/product-list/utils/swatch";
import type { ProductOption } from "@/types/product";

type Props = {
  options: ProductOption[];
  selected: Record<string, string>;
  onSelect: (optionName: string, value: string) => void;
  /** Whether a value is in stock given the current selection (default: always). */
  isAvailable?: (optionName: string, value: string) => boolean;
};

/** Renders each option by its `displayType`; out-of-stock values are disabled. */
export function VariantOptions({ options, selected, onSelect, isAvailable }: Props) {
  const avail = (name: string, value: string) => (isAvailable ? isAvailable(name, value) : true);

  return (
    <div className="space-y-4">
      {options.map((opt) => {
        const current = selected[opt.name];
        return (
          <div key={opt.id}>
            <div className="mb-2 flex items-center gap-2 text-sm">
              <span className="font-medium">{opt.name}</span>
              {current && <span className="text-muted-foreground">· {current}</span>}
            </div>

            {opt.displayType === "swatch" ? (
              <div className="flex flex-wrap gap-2.5">
                {opt.values.map((v) => {
                  const ok = avail(opt.name, v);
                  return (
                    <button
                      key={v}
                      type="button"
                      title={ok ? v : `${v} — hết hàng`}
                      aria-pressed={current === v}
                      disabled={!ok}
                      onClick={() => onSelect(opt.name, v)}
                      className={cn(
                        "relative size-8 rounded-full ring-1 ring-border ring-offset-2 ring-offset-background transition",
                        current === v ? "ring-2 ring-primary" : "hover:ring-foreground/40",
                        !ok && "cursor-not-allowed opacity-40 after:absolute after:inset-x-0 after:top-1/2 after:h-px after:-rotate-45 after:bg-foreground/60",
                      )}
                      style={{ backgroundColor: colorHex(v) }}
                    />
                  );
                })}
              </div>
            ) : opt.displayType === "dropdown" ? (
              <select
                value={current ?? ""}
                onChange={(e) => onSelect(opt.name, e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none"
              >
                <option value="" disabled>
                  Chọn {opt.name.toLowerCase()}
                </option>
                {opt.values.map((v) => {
                  const ok = avail(opt.name, v);
                  return (
                    <option key={v} value={v} disabled={!ok}>
                      {v}
                      {ok ? "" : " — hết hàng"}
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="flex flex-wrap gap-2">
                {opt.values.map((v) => {
                  const ok = avail(opt.name, v);
                  return (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={current === v}
                      disabled={!ok}
                      onClick={() => onSelect(opt.name, v)}
                      className={cn(
                        "min-w-12 rounded-lg border px-3 py-2 text-sm transition",
                        current === v
                          ? "border-primary bg-primary/5 font-medium text-foreground ring-1 ring-primary"
                          : "border-border hover:border-foreground/40",
                        !ok && "cursor-not-allowed text-muted-foreground line-through opacity-50 hover:border-border",
                      )}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
