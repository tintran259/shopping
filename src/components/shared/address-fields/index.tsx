"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useDistricts, useProvinces, useWards } from "@/hooks/use-location";
import { SearchSelect } from "@/components/shared/search-select";
import { VN_PROVINCES } from "@/features/checkout/constants";

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

export interface AddressValue {
  provinceCode: string;
  province: string;
  districtCode: string;
  district: string;
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
 * Reusable VN address picker: cascading Province → District → Ward via searchable
 * comboboxes (real data from the admin API) + a free-text street. Falls back to a
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
  const districts = useDistricts(value.provinceCode ? Number(value.provinceCode) : undefined);
  const wards = useWards(value.districtCode ? Number(value.districtCode) : undefined);
  const apiOk = provinces.isSuccess && provinces.data.length > 0;

  const provinceOpts = useMemo(
    () => (provinces.data ?? []).map((p) => ({ value: String(p.code), label: p.name })),
    [provinces.data],
  );
  const districtOpts = useMemo(
    () => (districts.data ?? []).map((d) => ({ value: String(d.code), label: d.name })),
    [districts.data],
  );
  const wardOpts = useMemo(
    () => (wards.data ?? []).map((w) => ({ value: String(w.code), label: w.name })),
    [wards.data],
  );
  const provinceFallbackOpts = useMemo(() => VN_PROVINCES.map((p) => ({ value: p, label: p })), []);

  const nameOf = (units: { code: number; name: string }[] | undefined, code: string) =>
    units?.find((u) => String(u.code) === code)?.name ?? "";
  const errCls = (v: string) => showErrors && !v.trim() && "border-destructive focus:border-destructive";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label required>Tỉnh / Thành phố</Label>
        {apiOk ? (
          <SearchSelect
            value={value.provinceCode}
            options={provinceOpts}
            onChange={(code) =>
              onChange({
                provinceCode: code,
                province: nameOf(provinces.data, code),
                districtCode: "",
                district: "",
                wardCode: "",
                ward: "",
              })
            }
            placeholder="— Chọn tỉnh / thành —"
            searchPlaceholder="Tìm tỉnh / thành…"
            error={showErrors && !value.province}
          />
        ) : (
          <SearchSelect
            value={value.province}
            options={provinceFallbackOpts}
            onChange={(p) => onChange({ province: p })}
            placeholder="— Chọn tỉnh / thành —"
            error={showErrors && !value.province}
          />
        )}
      </div>

      <div>
        <Label>Quận / Huyện</Label>
        {apiOk ? (
          <SearchSelect
            value={value.districtCode}
            options={districtOpts}
            disabled={!value.provinceCode}
            loading={districts.isLoading}
            onChange={(code) =>
              onChange({
                districtCode: code,
                district: nameOf(districts.data, code),
                wardCode: "",
                ward: "",
              })
            }
            placeholder="— Chọn quận / huyện —"
            searchPlaceholder="Tìm quận / huyện…"
          />
        ) : (
          <input
            value={value.district}
            onChange={(e) => onChange({ district: e.target.value })}
            placeholder="Quận 1"
            className={inputCls}
          />
        )}
      </div>

      <div>
        <Label>Phường / Xã</Label>
        {apiOk ? (
          <SearchSelect
            value={value.wardCode}
            options={wardOpts}
            disabled={!value.districtCode}
            loading={wards.isLoading}
            onChange={(code) => onChange({ wardCode: code, ward: nameOf(wards.data, code) })}
            placeholder="— Chọn phường / xã —"
            searchPlaceholder="Tìm phường / xã…"
          />
        ) : (
          <input
            value={value.ward}
            onChange={(e) => onChange({ ward: e.target.value })}
            placeholder="Phường Bến Nghé"
            className={inputCls}
          />
        )}
      </div>

      <div className="sm:col-span-2">
        <Label required>Địa chỉ cụ thể</Label>
        <input
          value={value.street}
          onChange={(e) => onChange({ street: e.target.value })}
          placeholder="Số nhà, tên đường"
          className={cn(inputCls, errCls(value.street))}
        />
      </div>
    </div>
  );
}
