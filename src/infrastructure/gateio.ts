import type { CoinId, PricePoint } from "@/domain/types";

const GATEIO_BASE = "https://api.gateio.ws/api/v4";
const MAX_POINTS = 1000; // limite Gate.io par requête

/**
 * Une bougie Gate.io : tableau de chaînes.
 * Index : [0] timestamp (s), [1] volume quote, [2] close, [3] high, [4] low, [5] open, ...
 */
type GateCandle = string[];

/**
 * Récupère l'historique de prix journalier (clôture, en USDT) d'une paire via Gate.io.
 * API publique sans clé : jusqu'à ~1000 jours d'historique par requête, toutes paires
 * majeures couvertes. On filtre ensuite sur la fenêtre demandée.
 *
 * Lève une erreur en cas d'échec ; l'appelant gère la résilience.
 */
export async function fetchPriceHistory(
  pair: CoinId,
  fromSeconds: number,
  toSeconds: number,
): Promise<PricePoint[]> {
  const url =
    `${GATEIO_BASE}/spot/candlesticks` +
    `?currency_pair=${pair}&interval=1d&limit=${MAX_POINTS}`;

  const response = await fetch(url, {
    headers: { accept: "application/json" },
    // Cache Next côté serveur : 1h. L'historique journalier ne change pas en intra-day.
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new PriceProviderError(`Gate.io a répondu ${response.status}`, response.status);
  }

  const candles = (await response.json()) as GateCandle[];

  return candles
    .map((candle) => ({
      timestamp: Number(candle[0]) * 1000,
      price: Number(candle[2]), // clôture
    }))
    .filter(
      (point) =>
        Number.isFinite(point.price) &&
        point.timestamp >= fromSeconds * 1000 &&
        point.timestamp <= toSeconds * 1000,
    );
}

export class PriceProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PriceProviderError";
  }
}
