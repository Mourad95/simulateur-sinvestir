import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchPriceHistory,
  fetchTradablePairs,
  PriceProviderError,
} from "./gateio";
import { toSeconds } from "@/lib/time";

/** Une bougie Gate.io : [timestamp_s, volumeQuote, close, high, low, open, ...]. */
function candle(timestampSeconds: number, close: number): string[] {
  return [String(timestampSeconds), "0", String(close), "0", "0", "0"];
}

function mockFetchOnce(
  response: Partial<Response> & { json?: () => Promise<unknown> },
) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, status: 200, ...response }),
  );
}

/** Mocke fetch en routant selon l'URL (currency_pairs vs tickers). */
function mockFetchByUrl(routes: {
  pairs?: unknown;
  tickers?: unknown;
  ok?: boolean;
  status?: number;
}) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((url: string) => {
      const isTickers = String(url).includes("/tickers");
      return Promise.resolve({
        ok: routes.ok ?? true,
        status: routes.status ?? 200,
        json: async () => (isTickers ? routes.tickers : routes.pairs) ?? [],
      });
    }),
  );
}

const ticker = (currency_pair: string, quote_volume: string) => ({
  currency_pair,
  quote_volume,
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchPriceHistory", () => {
  it("mappe les bougies en points {timestamp ms, price}", async () => {
    const day = 1_700_000_000;
    mockFetchOnce({
      json: async () => [candle(day, 100), candle(day + 86400, 110)],
    });

    const prices = await fetchPriceHistory("BTC_USDT", day, day + 86400);

    expect(prices).toEqual([
      { timestamp: day * 1000, price: 100 },
      { timestamp: (day + 86400) * 1000, price: 110 },
    ]);
  });

  it("filtre les points hors de la fenêtre demandée", async () => {
    const day = 1_700_000_000;
    mockFetchOnce({
      json: async () => [
        candle(day - 86400, 90), // avant la fenêtre
        candle(day, 100), // dans la fenêtre
        candle(day + 200000, 120), // après la fenêtre
      ],
    });

    const prices = await fetchPriceHistory("BTC_USDT", day, day + 86400);

    expect(prices).toHaveLength(1);
    expect(prices[0].price).toBe(100);
  });

  it("écarte les prix non numériques", async () => {
    const day = 1_700_000_000;
    mockFetchOnce({ json: async () => [[String(day), "0", "not-a-number"]] });

    const prices = await fetchPriceHistory("BTC_USDT", day, day + 86400);

    expect(prices).toHaveLength(0);
  });

  it("lève une PriceProviderError avec le status HTTP en cas d'échec", async () => {
    mockFetchOnce({ ok: false, status: 429 });

    await expect(
      fetchPriceHistory("BTC_USDT", 1_700_000_000, 1_700_086_400),
    ).rejects.toMatchObject({ status: 429 });
  });

  it("construit une URL Gate.io avec la paire demandée", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetchMock);

    await fetchPriceHistory("ETH_USDT", 1_700_000_000, 1_700_086_400);

    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain("currency_pair=ETH_USDT");
    expect(calledUrl).toContain("interval=1d");
  });
});

describe("fetchTradablePairs", () => {
  const pair = (over: Record<string, unknown>) => ({
    id: "X_USDT",
    base: "X",
    quote: "USDT",
    trade_status: "tradable",
    ...over,
  });

  it("ne garde que les paires USDT tradables et les trie par volume décroissant", async () => {
    mockFetchByUrl({
      pairs: [
        pair({ id: "SOL_USDT", base: "SOL", base_name: "Solana" }),
        pair({ id: "BTC_USDT", base: "BTC", base_name: "Bitcoin" }),
        pair({ id: "ETH_BTC", base: "ETH", quote: "BTC" }), // mauvais quote
        pair({ id: "OLD_USDT", base: "OLD", trade_status: "untradable" }), // non tradable
      ],
      tickers: [ticker("SOL_USDT", "5000"), ticker("BTC_USDT", "9000")],
    });

    const coins = await fetchTradablePairs();

    // BTC a plus de volume que SOL → il passe devant malgré l'ordre d'origine.
    expect(coins.map((c) => c.symbol)).toEqual(["BTC", "SOL"]);
    expect(coins[0]).toEqual({
      id: "BTC_USDT",
      symbol: "BTC",
      name: "Bitcoin",
    });
  });

  it("place les paires sans volume connu en fin de liste", async () => {
    mockFetchByUrl({
      pairs: [
        pair({ id: "AAA_USDT", base: "AAA" }), // pas de ticker
        pair({ id: "BBB_USDT", base: "BBB" }),
      ],
      tickers: [ticker("BBB_USDT", "100")],
    });

    const coins = await fetchTradablePairs();

    expect(coins.map((c) => c.symbol)).toEqual(["BBB", "AAA"]);
  });

  it("retombe sur le symbole quand le nom complet est absent", async () => {
    mockFetchByUrl({
      pairs: [pair({ id: "ZZZ_USDT", base: "ZZZ" })],
      tickers: [],
    });

    const coins = await fetchTradablePairs();

    expect(coins[0].name).toBe("ZZZ");
  });

  it("lève une PriceProviderError en cas d'échec HTTP", async () => {
    mockFetchByUrl({ ok: false, status: 503 });

    await expect(fetchTradablePairs()).rejects.toMatchObject({ status: 503 });
  });
});

describe("PriceProviderError", () => {
  it("conserve le status et un nom explicite", () => {
    const error = new PriceProviderError("boom", 502);
    expect(error.status).toBe(502);
    expect(error.name).toBe("PriceProviderError");
  });
});

// Garde-fou : toSeconds utilisé par les bornes de fenêtre reste cohérent.
describe("cohérence des bornes", () => {
  it("toSeconds tronque les millisecondes", () => {
    expect(toSeconds(1_700_000_999)).toBe(1_700_000);
  });
});
