import type { CoinId, PricePoint } from "@/domain/types";

type PricesApiResponse =
  | { prices: { timestamp: number; price: number }[]; cached: boolean }
  | { error: string };

/** Appelle l'API route interne (proxy CoinGecko). Lève une Error explicite si échec. */
export async function fetchPrices(
  coin: CoinId,
  startMs: number,
  endMs: number,
): Promise<PricePoint[]> {
  const from = Math.floor(startMs / 1000);
  const to = Math.floor(endMs / 1000);

  const response = await fetch(`/api/prices?coin=${coin}&from=${from}&to=${to}`);
  const data = (await response.json()) as PricesApiResponse;

  if (!response.ok || "error" in data) {
    const message = "error" in data ? data.error : "Erreur de récupération des données.";
    throw new Error(message);
  }

  return data.prices;
}
