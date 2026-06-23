import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPriceHistory, PriceProviderError } from "./gateio";
import { toSeconds } from "@/lib/time";

/** Une bougie Gate.io : [timestamp_s, volumeQuote, close, high, low, open, ...]. */
function candle(timestampSeconds: number, close: number): string[] {
  return [String(timestampSeconds), "0", String(close), "0", "0", "0"];
}

function mockFetchOnce(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, status: 200, ...response }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchPriceHistory", () => {
  it("mappe les bougies en points {timestamp ms, price}", async () => {
    const day = 1_700_000_000;
    mockFetchOnce({ json: async () => [candle(day, 100), candle(day + 86400, 110)] });

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
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetchMock);

    await fetchPriceHistory("ETH_USDT", 1_700_000_000, 1_700_086_400);

    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain("currency_pair=ETH_USDT");
    expect(calledUrl).toContain("interval=1d");
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
