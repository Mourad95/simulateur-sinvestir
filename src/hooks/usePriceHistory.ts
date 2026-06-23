import { useQuery } from "@tanstack/react-query";
import { fetchPrices } from "@/lib/prices-client";
import type { CoinId, PricePoint } from "@/domain/types";

/**
 * Récupère l'historique de prix d'une crypto sur une période.
 * State serveur géré par TanStack Query : cache, dédoublonnage des requêtes,
 * gestion native des requêtes obsolètes (plus besoin de garde manuelle).
 */
export function usePriceHistory(coin: CoinId, startDate: number, endDate: number) {
  return useQuery<PricePoint[]>({
    queryKey: ["prices", coin, startDate, endDate],
    queryFn: () => fetchPrices(coin, startDate, endDate),
    enabled: startDate < endDate,
  });
}
