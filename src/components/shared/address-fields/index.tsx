"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useProvinces, useWards } from "@/hooks/use-location";
import { SearchSelect } from "@/components/shared/search-select";

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

export interface AddressValue {
  provinceCode: string;
  province: string;
  wardCode: string;
  ward: string;
  street: string;
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-xs font-medium text-muted-foreground">
      {children} {required && <span className="text-destructive">*</span>}
    </label>
  );
}

/**
 * Reusable VN address picker (2025 2-tier model): cascading Province → Ward via
 * searchable comboboxes (data from shopping-api) + a free-text street. Falls back to a
 * province list + free text if the API is unreachable. Controlled via `value` +
 * `onChange(patch)`. Shared by checkout and the account address book.
 */
export function AddressFields({
  value,
  onChange,
  showErrors = false,
}: {
  value: AddressValue;
  onChange: (patch: Partial<AddressValue>) => void;
  showErrors?: boolean;
}) {
  const provinces = useProvinces();
  const wards = useWards(value.provinceCode ? Number(value.provinceCode) : undefined);

  const provinceOpts = useMemo(
    () => (provinces.data ?? []).map((p) => ({ value: String(p.code), label: p.name })),
    [provinces.data],
  );
  const wardOpts = useMemo(
    () => (wards.data ?? []).map((w) => ({ value: String(w.code), label: w.name })),
    [wards.data],
  );
  const nameOf = (units: { code: number; name: string }[] | undefined, code: string) =>
    units?.find((u) => String(u.code) === code)?.name ?? "";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label required>Tỉnh / Thành phố</Label>
        <SearchSelect
          value={value.provinceCode}
          options={provinceOpts}
          onChange={(code) =>
            onChange({
              provinceCode: code,
              province: nameOf(provinces.data, code),
              wardCode: "",
              ward: "",
            })
          }
          placeholder="— Chọn tỉnh / thành —"
          searchPlaceholder="Tìm tỉnh / thành…"
          error={showErrors && !value.province}
        />
      </div>

      <div>
        <Label>Phường / Xã</Label>
        <SearchSelect
          value={value.wardCode}
          options={wardOpts}
          disabled={!value.provinceCode}
          loading={wards.isLoading}
          onChange={(code) => onChange({ wardCode: code, ward: nameOf(wards.data, code) })}
          placeholder="— Chọn phường / xã —"
          searchPlaceholder="Tìm phường / xã…"
        />
      </div>

      <div className="sm:col-span-2">
        <Label required>Địa chỉ cụ thể</Label>
        <input
          value={value.street}
          onChange={(e) => onChange({ street: e.target.value })}
          placeholder="Số nhà, tên đường"
          className={cn(inputCls, showErrors && !value.street.trim() && "border-destructive focus:border-destructive")}
        />
      </div>
    </div>
  );
}
