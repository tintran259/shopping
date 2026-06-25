"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProvinces, fetchWards } from "@/services/location.service";

/** Administrative data is effectively static — cache it hard. */
const STATIC = { staleTime: Infinity, gcTime: Infinity, retry: 1 } as const;

export function useProvinces() {
  return useQuery({
    queryKey: ["provinces"],
    queryFn: fetchProvinces,
    ...STATIC,
    meta: { errorToast: "Không tải được danh sách tỉnh/thành. Vui lòng thử lại." },
  });
}

/** Wards belong directly to a province (2-tier model). */
export function useWards(provinceCode?: number) {
  return useQuery({
    queryKey: ["wards", provinceCode],
    queryFn: () => fetchWards(provinceCode!),
    enabled: provinceCode != null,
    ...STATIC,
    meta: { errorToast: "Không tải được danh sách phường/xã. Vui lòng thử lại." },
  });
}
