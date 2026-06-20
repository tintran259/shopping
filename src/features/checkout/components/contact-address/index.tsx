"use client";

import { cn } from "@/lib/utils";
import { useCheckoutStore } from "@/store/checkout.store";
import { useDistricts, useProvinces, useWards } from "@/hooks/use-location";
import { VN_PROVINCES } from "../../constants";

const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-xs font-medium text-muted-foreground">
      {children} {required && <span className="text-destructive">*</span>}
    </label>
  );
}

/** Recipient contact + (for home delivery) the shipping address. */
export function ContactAddress({ showErrors }: { showErrors: boolean }) {
  const { recipientName, phone, email, address, fulfillment, update, setAddress } =
    useCheckoutStore();
  const isDelivery = fulfillment === "delivery";
  const missing = (v: string) => showErrors && !v.trim();
  const errCls = (v: string) => missing(v) && "border-destructive focus:border-destructive";

  const provinces = useProvinces();
  const districts = useDistricts(address.provinceCode ? Number(address.provinceCode) : undefined);
  const wards = useWards(address.districtCode ? Number(address.districtCode) : undefined);
  // Real cascading selects when the admin API is reachable; otherwise a simple
  // province list + free-text district/ward so checkout never blocks.
  const apiOk = provinces.isSuccess && provinces.data.length > 0;

  const nameOf = (units: { code: number; name: string }[] | undefined, code: string) =>
    units?.find((u) => String(u.code) === code)?.name ?? "";

  return (
    <section className="rounded-2xl border border-border bg-(--theme-card-background,var(--card)) p-5">
      <h2 className="text-base font-semibold">Thông tin nhận hàng</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label required>Họ và tên</Label>
          <input
            value={recipientName}
            onChange={(e) => update({ recipientName: e.target.value })}
            placeholder="Nguyễn Văn A"
            className={cn(inputCls, errCls(recipientName))}
          />
        </div>
        <div>
          <Label required>Số điện thoại</Label>
          <input
            value={phone}
            inputMode="tel"
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="09xx xxx xxx"
            className={cn(inputCls, errCls(phone))}
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Email (nhận xác nhận đơn)</Label>
          <input
            value={email}
            inputMode="email"
            onChange={(e) => update({ email: e.target.value })}
            placeholder="email@example.com"
            className={inputCls}
          />
        </div>
      </div>

      {isDelivery && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label required>Tỉnh / Thành phố</Label>
            {apiOk ? (
              <select
                value={address.provinceCode}
                onChange={(e) => {
                  const code = e.target.value;
                  setAddress({
                    provinceCode: code,
                    province: nameOf(provinces.data, code),
                    districtCode: "",
                    district: "",
                    wardCode: "",
                    ward: "",
                  });
                }}
                className={cn(inputCls, errCls(address.province))}
              >
                <option value="">— Chọn tỉnh / thành —</option>
                {provinces.data.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={address.province}
                onChange={(e) => setAddress({ province: e.target.value })}
                className={cn(inputCls, errCls(address.province))}
              >
                <option value="">— Chọn tỉnh / thành —</option>
                {VN_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <Label>Quận / Huyện</Label>
            {apiOk ? (
              <select
                value={address.districtCode}
                disabled={!address.provinceCode || districts.isLoading}
                onChange={(e) => {
                  const code = e.target.value;
                  setAddress({
                    districtCode: code,
                    district: nameOf(districts.data, code),
                    wardCode: "",
                    ward: "",
                  });
                }}
                className={inputCls}
              >
                <option value="">{districts.isLoading ? "Đang tải…" : "— Chọn quận / huyện —"}</option>
                {districts.data?.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={address.district}
                onChange={(e) => setAddress({ district: e.target.value })}
                placeholder="Quận 1"
                className={inputCls}
              />
            )}
          </div>

          <div>
            <Label>Phường / Xã</Label>
            {apiOk ? (
              <select
                value={address.wardCode}
                disabled={!address.districtCode || wards.isLoading}
                onChange={(e) =>
                  setAddress({ wardCode: e.target.value, ward: nameOf(wards.data, e.target.value) })
                }
                className={inputCls}
              >
                <option value="">{wards.isLoading ? "Đang tải…" : "— Chọn phường / xã —"}</option>
                {wards.data?.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={address.ward}
                onChange={(e) => setAddress({ ward: e.target.value })}
                placeholder="Phường Bến Nghé"
                className={inputCls}
              />
            )}
          </div>

          <div className="sm:col-span-2">
            <Label required>Địa chỉ cụ thể</Label>
            <input
              value={address.street}
              onChange={(e) => setAddress({ street: e.target.value })}
              placeholder="Số nhà, tên đường"
              className={cn(inputCls, errCls(address.street))}
            />
          </div>
        </div>
      )}
    </section>
  );
}
