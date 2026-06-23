import type { Coin } from "@/core/types";

type CoinsApiResponse = { coins: Coin[]; cached: boolean } | { error: string };

/** Appelle l'API route interne listant les paires USDT. Lève une Error si échec. */
export async function fetchCoins(): Promise<Coin[]> {
  const response = await fetch("/api/coins");
  const data = (await response.json()) as CoinsApiResponse;

  if (!response.ok || "error" in data) {
    const message = "error" in data ? data.error : "Erreur de récupération des cryptos.";
    throw new Error(message);
  }

  return data.coins;
}
