import { useQuery } from "@tanstack/react-query";
import { fetchCoins } from "@/lib/coins-client";
import { FALLBACK_COINS, type Coin } from "@/domain/types";

/**
 * Liste des cryptos sélectionnables (paires USDT Gate.io).
 * `FALLBACK_COINS` sert de valeur initiale et de filet si l'API échoue,
 * pour que le simulateur reste utilisable en toute circonstance.
 */
export function useCoins() {
  const query = useQuery<Coin[]>({
    queryKey: ["coins"],
    queryFn: fetchCoins,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const coins = query.data ?? FALLBACK_COINS;
  return { coins, isLoading: query.isLoading };
}
