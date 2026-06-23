import type { CoinId, PricePoint } from "@/core/types";
import { toSeconds } from "@/core/time";

type PricesApiResponse =
  | { prices: { timestamp: number; price: number }[]; cached: boolean }
  | { error: string };

/** Appelle l'API route interne (proxy du fournisseur de prix). Lève une Error si échec. */
export async function fetchPrices(
  coin: CoinId,
  startMs: number,
  endMs: number,
): Promise<PricePoint[]> {
  const from = toSeconds(startMs);
  const to = toSeconds(endMs);

  const response = await fetch(`/api/prices?coin=${coin}&from=${from}&to=${to}`);
  const data = (await response.json()) as PricesApiResponse;

  if (!response.ok || "error" in data) {
    const message = "error" in data ? data.error : "Erreur de récupération des données.";
    throw new Error(message);
  }

  return data.prices;
}
