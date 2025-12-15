import { useQuery } from "@tanstack/react-query";
import { getAllPricing } from "../pricing";
import { QUERY_KEYS } from "../constants";

export function useAllPricing() {
  return useQuery({
    queryKey: QUERY_KEYS.allPricing,
    queryFn: () => getAllPricing(),
  });
}
