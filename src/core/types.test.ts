import { describe, expect, it } from "vitest";
import { isValidCoin } from "./types";

describe("isValidCoin", () => {
  it("accepte une paire USDT bien formée", () => {
    expect(isValidCoin("BTC_USDT")).toBe(true);
    expect(isValidCoin("SOL2_USDT")).toBe(true);
  });

  it("rejette les paires non-USDT ou mal formées", () => {
    expect(isValidCoin("BTC_BTC")).toBe(false);
    expect(isValidCoin("BTC")).toBe(false);
    expect(isValidCoin("btc_usdt")).toBe(false); // minuscules
    expect(isValidCoin("_USDT")).toBe(false);
  });

  it("rejette les valeurs non-string", () => {
    expect(isValidCoin(undefined)).toBe(false);
    expect(isValidCoin(42)).toBe(false);
    expect(isValidCoin(null)).toBe(false);
  });
});
