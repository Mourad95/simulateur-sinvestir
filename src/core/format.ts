// Les prix proviennent de Gate.io en USDT (≈ USD) : on affiche donc en dollars.
const usdFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdPreciseFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const formatMoney = (value: number): string => usdFormatter.format(value);
export const formatMoneyPrecise = (value: number): string =>
  usdPreciseFormatter.format(value);

/** `ratio` est un ratio (0.42 → "+42 %"). */
export const formatPercent = (ratio: number): string => percentFormatter.format(ratio);

export const formatDate = (timestamp: number): string =>
  dateFormatter.format(new Date(timestamp));

/** Format ISO `yyyy-mm-dd` pour les <input type="date">. */
export const toDateInputValue = (timestamp: number): string =>
  new Date(timestamp).toISOString().slice(0, 10);

export const fromDateInputValue = (value: string): number => new Date(value).getTime();
