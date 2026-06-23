/**
 * Types du domaine — logique métier pure, sans dépendance framework.
 * Le simulateur réalise un backtest rétrospectif (DCA ou one-shot) sur données historiques.
 */

/**
 * Identifiant d'une crypto = paire spot Gate.io contre USDT (ex: "BTC_USDT").
 * La liste réelle est récupérée dynamiquement via Gate.io ; le type reste un
 * `string` validé au runtime par `isValidCoin`.
 */
export type CoinId = string;

/** Une crypto sélectionnable, telle qu'exposée à la présentation. */
export type Coin = Readonly<{
  /** Paire Gate.io, ex: "BTC_USDT". */
  id: CoinId;
  /** Symbole, ex: "BTC". */
  symbol: string;
  /** Nom complet, ex: "Bitcoin". */
  name: string;
}>;

/**
 * Liste minimale servant de valeur initiale et de filet si l'API échoue.
 * La liste complète (2000+ paires USDT) est chargée dynamiquement.
 */
export const FALLBACK_COINS: readonly Coin[] = [
  { id: "BTC_USDT", symbol: "BTC", name: "Bitcoin" },
  { id: "ETH_USDT", symbol: "ETH", name: "Ethereum" },
  { id: "SOL_USDT", symbol: "SOL", name: "Solana" },
  { id: "ADA_USDT", symbol: "ADA", name: "Cardano" },
  { id: "XRP_USDT", symbol: "XRP", name: "XRP" },
];

export const DEFAULT_COIN = FALLBACK_COINS[0];

/** Type guard : `value` a-t-il la forme d'un identifiant de paire USDT ? */
export const isValidCoin = (value: unknown): value is CoinId =>
  typeof value === "string" && /^[A-Z0-9]+_USDT$/.test(value);

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
