/**
 * Types du domaine — logique métier pure, sans dépendance framework.
 * Le simulateur réalise un backtest rétrospectif (DCA ou one-shot) sur données historiques.
 */

/**
 * Cryptos proposées. `id` = paire Gate.io (spot, contre USDT) utilisée pour
 * récupérer l'historique de prix.
 */
export const SUPPORTED_COINS = [
  { id: "BTC_USDT", symbol: "BTC", label: "Bitcoin" },
  { id: "ETH_USDT", symbol: "ETH", label: "Ethereum" },
  { id: "SOL_USDT", symbol: "SOL", label: "Solana" },
  { id: "ADA_USDT", symbol: "ADA", label: "Cardano" },
  { id: "XRP_USDT", symbol: "XRP", label: "XRP" },
] as const;

export type CoinId = (typeof SUPPORTED_COINS)[number]["id"];

/** Fréquence d'apport. `once` = investissement unique ; sinon DCA récurrent. */
export type Frequency = "once" | "weekly" | "monthly";

/** Un point de prix historique : timestamp (ms) + prix en EUR. */
export type PricePoint = Readonly<{
  timestamp: number;
  price: number;
}>;

/** Paramètres d'une simulation, fournis par l'utilisateur. */
export type SimulationInput = Readonly<{
  /** Montant de chaque apport en EUR (ou montant unique si `once`). */
  amount: number;
  frequency: Frequency;
  /** Date de début incluse (timestamp ms). */
  startDate: number;
  /** Date de fin incluse (timestamp ms). */
  endDate: number;
  /** Taux annuel du placement de comparaison (ex: 0.03 pour Livret A 3%). */
  comparisonRate: number;
}>;

/** Un point de la courbe d'évolution (un par apport, valorisé à la date de fin de série). */
export type EvolutionPoint = Readonly<{
  timestamp: number;
  /** Cumul investi à cette date. */
  invested: number;
  /** Valeur du portefeuille crypto à cette date. */
  cryptoValue: number;
  /** Valeur du placement de comparaison (Livret A) à cette date. */
  comparisonValue: number;
}>;

/** Résultat complet d'une simulation. */
export type SimulationResult = Readonly<{
  totalInvested: number;
  finalCryptoValue: number;
  finalComparisonValue: number;
  /** Plus/moins-value crypto en EUR (peut être négative). */
  gainAmount: number;
  /** Plus/moins-value crypto en % (ratio, ex: 0.42 pour +42%). */
  gainPercent: number;
  /** Performance annualisée (CAGR) du portefeuille crypto. */
  annualizedReturn: number;
  /** Nombre d'apports effectués. */
  contributionsCount: number;
  evolution: readonly EvolutionPoint[];
}>;
