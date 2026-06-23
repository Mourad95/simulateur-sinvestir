import { DEFAULT_COIN } from "./types";

/** Constantes du domaine — valeurs métier et temporelles partagées. */

export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const DAYS_PER_YEAR = 365.25;

/** Placement de comparaison : Livret A (taux plafond de référence). */
export const COMPARISON_RATE = 0.03;
export const COMPARISON_LABEL = "Livret A (3 %)";

/**
 * Fenêtre d'historique par défaut, en années. Gate.io fournit ~1000 jours
 * (≈ 2,7 ans) par requête : 2 ans reste largement dans la fenêtre couverte.
 */
export const DEFAULT_HISTORY_YEARS = 2;

/** Crypto et montant proposés par défaut au chargement. */
export const DEFAULT_COIN_ID = DEFAULT_COIN.id;
export const DEFAULT_AMOUNT = 100;
