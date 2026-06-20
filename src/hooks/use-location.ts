"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDistricts, fetchProvinces, fetchWards } from "@/services/location.service";

/** Administrative data is effectively static — cache it hard. */
const STATIC = { staleTime: Infinity, gcTime: Infinity, retry: 1 } as const;

export function useProvinces() {
  return useQuery({ queryKey: ["provinces"], queryFn: fetchProvinces, ...STATIC });
}

export function useDistricts(provinceCode?: number) {
  return useQuery({
    queryKey: ["districts", provinceCode],
    queryFn: () => fetchDistricts(provinceCode!),
    enabled: provinceCode != null,
    ...STATIC,
  });
}

export function useWards(districtCode?: number) {
  return useQuery({
    queryKey: ["wards", districtCode],
    queryFn: () => fetchWards(districtCode!),
    enabled: districtCode != null,
    ...STATIC,
  });
}
