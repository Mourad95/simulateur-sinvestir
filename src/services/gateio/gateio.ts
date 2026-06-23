import type { Coin, CoinId, PricePoint } from "@/domain/types";
import {
  GATEIO_BASE_URL,
  MAX_CANDLES,
  PRICE_CACHE_TTL_SECONDS,
  COINS_CACHE_TTL_SECONDS,
} from "@/config/prices";
import { toMs } from "@/lib/time";

/**
 * Une bougie Gate.io : tableau de chaînes.
 * Index : [0] timestamp (s), [1] volume quote, [2] close, [3] high, [4] low, [5] open, ...
 */
type GateCandle = string[];

/** Paire spot renvoyée par Gate.io (champs utiles seulement). */
type GatePair = {
  id: string;
  base: string;
  base_name?: string;
  quote: string;
  trade_status: string;
};

/** Ticker spot Gate.io (champs utiles seulement). */
type GateTicker = {
  currency_pair: string;
  quote_volume?: string;
};

/** GET JSON sur Gate.io avec cache Next ; lève une PriceProviderError si échec. */
async function gateioGet<T>(path: string, revalidate: number): Promise<T> {
  const response = await fetch(`${GATEIO_BASE_URL}${path}`, {
    headers: { accept: "application/json" },
    next: { revalidate },
  });
  if (!response.ok) {
    throw new PriceProviderError(`Gate.io a répondu ${response.status}`, response.status);
  }
  return response.json() as Promise<T>;
}

/**
 * Récupère la liste des paires spot tradables contre USDT via Gate.io,
 * triées par volume 24h décroissant (cryptos majeures en tête).
 * `name` utilise le nom complet quand Gate.io le fournit.
 *
 * Lève une PriceProviderError en cas d'échec ; l'appelant gère la résilience.
 */
export async function fetchTradablePairs(): Promise<Coin[]> {
  const [pairs, tickers] = await Promise.all([
    gateioGet<GatePair[]>("/spot/currency_pairs", COINS_CACHE_TTL_SECONDS),
    gateioGet<GateTicker[]>("/spot/tickers", COINS_CACHE_TTL_SECONDS),
  ]);

  const volumeByPair = new Map(
    tickers.map((ticker) => [ticker.currency_pair, Number(ticker.quote_volume) || 0]),
  );

  return pairs
    .filter((pair) => pair.quote === "USDT" && pair.trade_status === "tradable")
    .map((pair) => ({
      id: pair.id,
      symbol: pair.base,
      name: pair.base_name?.trim() || pair.base,
    }))
    .sort((a, b) => (volumeByPair.get(b.id) ?? 0) - (volumeByPair.get(a.id) ?? 0));
}

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
    `${GATEIO_BASE_URL}/spot/candlesticks` +
    `?currency_pair=${pair}&interval=1d&limit=${MAX_CANDLES}`;

  const response = await fetch(url, {
    headers: { accept: "application/json" },
    // Cache Next côté serveur : l'historique journalier ne change pas en intra-day.
    next: { revalidate: PRICE_CACHE_TTL_SECONDS },
  });

  if (!response.ok) {
    throw new PriceProviderError(`Gate.io a répondu ${response.status}`, response.status);
  }

  const candles = (await response.json()) as GateCandle[];
  const fromMs = toMs(fromSeconds);
  const toMsBound = toMs(toSeconds);

  return candles
    .map((candle) => ({
      timestamp: toMs(Number(candle[0])),
      price: Number(candle[2]), // clôture
    }))
    .filter(
      (point) =>
        Number.isFinite(point.price) &&
        point.timestamp >= fromMs &&
        point.timestamp <= toMsBound,
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
