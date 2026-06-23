/** Configuration centralisée du fournisseur de prix (Gate.io) et du cache. */

export const GATEIO_BASE_URL = "https://api.gateio.ws/api/v4";

/** Limite de bougies renvoyées par Gate.io en une requête. */
export const MAX_CANDLES = 1000;

/** Durée de cache des prix (mémoire + revalidation Next). 1 h. */
export const PRICE_CACHE_TTL_MS = 60 * 60 * 1000;

/** Même durée en secondes, pour l'option `next.revalidate`. */
export const PRICE_CACHE_TTL_SECONDS = PRICE_CACHE_TTL_MS / 1000;
