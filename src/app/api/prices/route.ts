import { NextResponse } from "next/server";
import { PriceProviderError, fetchPriceHistory } from "@/infrastructure/gateio";
import { isValidCoin, type CoinId, type PricePoint } from "@/domain/types";
import { PRICE_CACHE_TTL_MS } from "@/config/prices";

/** Cache mémoire process-local : amortit les rate limits du fournisseur entre requêtes. */
const cache = new Map<string, { data: PricePoint[]; expiresAt: number }>();

/**
 * GET /api/prices?coin=BTC_USDT&from=<sec>&to=<sec>
 * Proxy du fournisseur de prix : masque la source, gère le cache et les erreurs côté serveur.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const params = parseParams(new URL(request.url).searchParams);
  if ("error" in params) {
    return NextResponse.json({ error: params.error }, { status: 400 });
  }

  const cacheKey = `${params.coin}:${params.from}:${params.to}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > nowMs()) {
    return NextResponse.json({ prices: cached.data, cached: true });
  }

  try {
    const prices = await fetchPriceHistory(params.coin, params.from, params.to);
    cache.set(cacheKey, { data: prices, expiresAt: nowMs() + PRICE_CACHE_TTL_MS });
    return NextResponse.json({ prices, cached: false });
  } catch (error) {
    const status = error instanceof PriceProviderError && error.status === 429 ? 429 : 502;
    const message =
      status === 429
        ? "Trop de requêtes vers le fournisseur de données. Réessayez dans un instant."
        : "Impossible de récupérer les données de marché pour le moment.";
    return NextResponse.json({ error: message }, { status });
  }
}

type ParsedParams = { coin: CoinId; from: number; to: number } | { error: string };

function parseParams(search: URLSearchParams): ParsedParams {
  const coin = search.get("coin");
  const from = Number(search.get("from"));
  const to = Number(search.get("to"));

  if (!isValidCoin(coin)) {
    return { error: "Crypto non supportée." };
  }
  if (!Number.isFinite(from) || !Number.isFinite(to) || from >= to) {
    return { error: "Période invalide." };
  }
  return { coin, from, to };
}

// new Date()/Date.now() restent légitimes ici : code serveur runtime, hors workflow.
const nowMs = (): number => Date.now();
