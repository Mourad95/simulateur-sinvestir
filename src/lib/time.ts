import { MS_PER_DAY, DAYS_PER_YEAR } from "@/domain/constants";

/** Conversions temporelles partagées (pure functions). */

export const toSeconds = (ms: number): number => Math.floor(ms / 1000);
export const toMs = (seconds: number): number => seconds * 1000;

export const daysBetween = (fromMs: number, toMs: number): number =>
  (toMs - fromMs) / MS_PER_DAY;

export const yearsBetween = (fromMs: number, toMs: number): number =>
  daysBetween(fromMs, toMs) / DAYS_PER_YEAR;

/** Date du jour normalisée à minuit (bornes stables d'un rendu à l'autre). */
export const startOfToday = (): number => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
};

/** Timestamp correspondant à `years` années avant `endMs`. */
export const yearsBefore = (endMs: number, years: number): number =>
  endMs - years * 365 * MS_PER_DAY;
