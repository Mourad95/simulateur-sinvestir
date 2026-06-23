import { describe, expect, it } from "vitest";
import { buildContributionDates, findClosestPrice, runBacktest } from "./backtest";
import { MS_PER_DAY as DAY } from "./constants";
import type { PricePoint, SimulationInput } from "./types";

/** Construit une série de prix journaliers à partir d'un tableau de prix. */
function buildPrices(start: number, dailyPrices: number[]): PricePoint[] {
  return dailyPrices.map((price, i) => ({ timestamp: start + i * DAY, price }));
}

describe("buildContributionDates", () => {
  it("renvoie une seule date pour un investissement unique", () => {
    const input = baseInput({ frequency: "once" });
    expect(buildContributionDates(input)).toEqual([input.startDate]);
  });

  it("génère des apports hebdomadaires sur la période", () => {
    const start = 0;
    const input = baseInput({ frequency: "weekly", startDate: start, endDate: start + 21 * DAY });
    expect(buildContributionDates(input)).toHaveLength(4); // j0, j7, j14, j21
  });
});

describe("findClosestPrice", () => {
  it("renvoie null sur une série vide", () => {
    expect(findClosestPrice([], 0)).toBeNull();
  });

  it("trouve le point le plus proche dans le temps", () => {
    const prices = buildPrices(0, [100, 110, 120]);
    expect(findClosestPrice(prices, DAY + 1000)?.price).toBe(110);
  });
});

describe("runBacktest — investissement unique", () => {
  it("calcule une plus-value quand le prix double", () => {
    const prices = buildPrices(0, [100, 150, 200]);
    const input = baseInput({
      frequency: "once",
      amount: 1000,
      startDate: 0,
      endDate: 2 * DAY,
    });

    const result = runBacktest(input, prices);

    expect(result.totalInvested).toBe(1000);
    expect(result.finalCryptoValue).toBeCloseTo(2000); // 10 unités × 200
    expect(result.gainAmount).toBeCloseTo(1000);
    expect(result.gainPercent).toBeCloseTo(1); // +100%
    expect(result.contributionsCount).toBe(1);
  });

  it("calcule une moins-value quand le prix chute", () => {
    const prices = buildPrices(0, [200, 150, 100]);
    const result = runBacktest(
      baseInput({ frequency: "once", amount: 1000, startDate: 0, endDate: 2 * DAY }),
      prices,
    );
    expect(result.gainAmount).toBeCloseTo(-500); // 5 unités × 100 = 500
    expect(result.gainPercent).toBeCloseTo(-0.5);
  });
});

describe("runBacktest — DCA", () => {
  it("accumule les unités à chaque apport hebdomadaire", () => {
    const prices = buildPrices(0, Array.from({ length: 15 }, () => 100)); // prix stable à 100
    const input = baseInput({
      frequency: "weekly",
      amount: 100,
      startDate: 0,
      endDate: 14 * DAY,
    });

    const result = runBacktest(input, prices);

    expect(result.contributionsCount).toBe(3); // j0, j7, j14
    expect(result.totalInvested).toBe(300);
    expect(result.finalCryptoValue).toBeCloseTo(300); // prix stable → pas de gain
    expect(result.gainPercent).toBeCloseTo(0);
  });
});

describe("runBacktest — comparaison Livret A", () => {
  it("capitalise le placement de comparaison sur la durée de détention", () => {
    const prices = buildPrices(0, Array.from({ length: 366 }, () => 100));
    const input = baseInput({
      frequency: "once",
      amount: 1000,
      startDate: 0,
      endDate: 365 * DAY,
      comparisonRate: 0.03,
    });

    const result = runBacktest(input, prices);

    // 1000 € à 3% sur ~1 an ≈ 1030 €
    expect(result.finalComparisonValue).toBeGreaterThan(1029);
    expect(result.finalComparisonValue).toBeLessThan(1031);
  });
});

describe("runBacktest — cas limites", () => {
  it("renvoie un résultat vide sur une série de prix vide", () => {
    const result = runBacktest(baseInput({}), []);
    expect(result.totalInvested).toBe(0);
    expect(result.evolution).toHaveLength(0);
  });
});

function baseInput(overrides: Partial<SimulationInput>): SimulationInput {
  return {
    amount: 100,
    frequency: "monthly",
    startDate: 0,
    endDate: 30 * DAY,
    comparisonRate: 0.03,
    ...overrides,
  };
}
