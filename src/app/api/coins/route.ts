import { NextResponse } from "next/server";
import { PriceProviderError, fetchTradablePairs } from "@/infrastructure/gateio";
import { COINS_CACHE_TTL_MS } from "@/config/prices";
import type { Coin } from "@/domain/types";

/** Cache mémoire process-local : la liste des paires change rarement. */
let cache: { data: Coin[]; expiresAt: number } | null = null;

/**
 * GET /api/coins
 * Proxy de la liste des paires USDT tradables (Gate.io), avec cache.
 */
export async function GET(): Promise<NextResponse> {
  if (cache && cache.expiresAt > Date.now()) {
    return NextResponse.json({ coins: cache.data, cached: true });
  }

  try {
    const coins = await fetchTradablePairs();
    cache = { data: coins, expiresAt: Date.now() + COINS_CACHE_TTL_MS };
    return NextResponse.json({ coins, cached: false });
  } catch (error) {
    const status = error instanceof PriceProviderError && error.status === 429 ? 429 : 502;
    return NextResponse.json(
      { error: "Impossible de récupérer la liste des cryptos pour le moment." },
      { status },
    );
  }
}
