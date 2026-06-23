import type {
  EvolutionPoint,
  Frequency,
  PricePoint,
  SimulationInput,
  SimulationResult,
} from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_YEAR = 365.25;

/** Intervalle entre deux apports, en jours. `once` n'a pas d'intervalle récurrent. */
const FREQUENCY_DAYS: Record<Exclude<Frequency, "once">, number> = {
  weekly: 7,
  monthly: 30,
};

/**
 * Renvoie les dates d'apport (timestamps ms) sur la période, selon la fréquence.
 * `once` → un seul apport à la date de début.
 */
export function buildContributionDates(input: SimulationInput): number[] {
  if (input.frequency === "once") {
    return [input.startDate];
  }

  const stepMs = FREQUENCY_DAYS[input.frequency] * MS_PER_DAY;
  const dates: number[] = [];
  for (let t = input.startDate; t <= input.endDate; t += stepMs) {
    dates.push(t);
  }
  return dates;
}

/**
 * Trouve le prix historique le plus proche d'une date donnée.
 * Les séries CoinGecko sont journalières ; on prend le point le plus proche dans le temps.
 */
export function findClosestPrice(
  prices: readonly PricePoint[],
  timestamp: number,
): PricePoint | null {
  if (prices.length === 0) return null;

  let closest = prices[0];
  let smallestDelta = Math.abs(prices[0].timestamp - timestamp);

  for (const point of prices) {
    const delta = Math.abs(point.timestamp - timestamp);
    if (delta < smallestDelta) {
      smallestDelta = delta;
      closest = point;
    }
  }
  return closest;
}

/** Valeur d'un placement à taux composé quotidien, après `days` jours. */
function compoundValue(principal: number, annualRate: number, days: number): number {
  const years = days / DAYS_PER_YEAR;
  return principal * Math.pow(1 + annualRate, years);
}

/**
 * Exécute le backtest : pour chaque apport, on achète au prix du jour,
 * puis on valorise l'ensemble des unités à la fin de la période.
 * En parallèle, on calcule la valeur d'un placement de comparaison (Livret A).
 */
export function runBacktest(
  input: SimulationInput,
  prices: readonly PricePoint[],
): SimulationResult {
  const sorted = [...prices].sort((a, b) => a.timestamp - b.timestamp);
  const finalPricePoint = sorted.at(-1);

  if (!finalPricePoint) {
    return emptyResult();
  }

  const finalTimestamp = finalPricePoint.timestamp;
  const contributionDates = buildContributionDates(input).filter(
    (date) => date <= finalTimestamp,
  );

  let totalUnits = 0;
  let totalInvested = 0;
  let comparisonValue = 0;
  const evolution: EvolutionPoint[] = [];

  for (const date of contributionDates) {
    const pricePoint = findClosestPrice(sorted, date);
    if (!pricePoint || pricePoint.price <= 0) continue;

    totalUnits += input.amount / pricePoint.price;
    totalInvested += input.amount;

    // Le placement de comparaison capitalise jusqu'à la fin de la période.
    const daysHeld = (finalTimestamp - date) / MS_PER_DAY;
    comparisonValue += compoundValue(input.amount, input.comparisonRate, daysHeld);

    evolution.push({
      timestamp: date,
      invested: totalInvested,
      cryptoValue: totalUnits * pricePoint.price,
      comparisonValue,
    });
  }

  const finalCryptoValue = totalUnits * finalPricePoint.price;
  const gainAmount = finalCryptoValue - totalInvested;
  const gainPercent = totalInvested > 0 ? gainAmount / totalInvested : 0;

  return {
    totalInvested,
    finalCryptoValue,
    finalComparisonValue: comparisonValue,
    gainAmount,
    gainPercent,
    annualizedReturn: annualizedReturn(input, totalInvested, finalCryptoValue),
    contributionsCount: evolution.length,
    evolution,
  };
}

/**
 * CAGR approximé sur la durée de la période (début → fin).
 * Pour du DCA, c'est une approximation : on utilise la durée totale de détention.
 */
function annualizedReturn(
  input: SimulationInput,
  invested: number,
  finalValue: number,
): number {
  if (invested <= 0 || finalValue <= 0) return 0;
  const years = (input.endDate - input.startDate) / (MS_PER_DAY * DAYS_PER_YEAR);
  if (years <= 0) return 0;
  return Math.pow(finalValue / invested, 1 / years) - 1;
}

function emptyResult(): SimulationResult {
  return {
    totalInvested: 0,
    finalCryptoValue: 0,
    finalComparisonValue: 0,
    gainAmount: 0,
    gainPercent: 0,
    annualizedReturn: 0,
    contributionsCount: 0,
    evolution: [],
  };
}
