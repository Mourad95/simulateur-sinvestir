"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { SimulatorForm, type FormState } from "./SimulatorForm";
import { ResultCards } from "./ResultCards";
import { Card } from "./ui/primitives";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { runBacktest } from "@/domain/backtest";
import { SUPPORTED_COINS, type CoinId } from "@/domain/types";
import {
  COMPARISON_RATE,
  COMPARISON_LABEL,
  DEFAULT_HISTORY_YEARS,
  DEFAULT_COIN_ID,
  DEFAULT_AMOUNT,
} from "@/domain/constants";
import { startOfToday, yearsBefore } from "@/lib/time";
import { formatMoney } from "@/lib/format";

// Recharts mesure le DOM : on évite son rendu serveur (warning de taille au prerender).
const EvolutionChart = dynamic(
  () => import("./EvolutionChart").then((m) => m.EvolutionChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] w-full animate-pulse rounded-lg bg-surface" />
    ),
  },
);

const EMPTY_PRICES = [] as const;

/**
 * Composant simulateur autonome et embeddable.
 * Reçoit ses valeurs par défaut en props → réutilisable hors de cette app.
 */
export function Simulator({
  defaultCoinId = DEFAULT_COIN_ID,
  defaultAmount = DEFAULT_AMOUNT,
  compact = false,
}: {
  defaultCoinId?: CoinId;
  defaultAmount?: number;
  compact?: boolean;
}) {
  const [form, setForm] = useState<FormState>(() =>
    initialForm(defaultCoinId, defaultAmount),
  );

  // State serveur délégué à TanStack Query (cache, dédoublonnage, requêtes obsolètes).
  const {
    data: prices = EMPTY_PRICES,
    isFetching,
    isError,
    error,
  } = usePriceHistory(form.coinId, form.startDate, form.endDate);

  const result = useMemo(
    () =>
      runBacktest(
        {
          amount: form.amount,
          frequency: form.frequency,
          startDate: form.startDate,
          endDate: form.endDate,
          comparisonRate: COMPARISON_RATE,
        },
        prices,
      ),
    [form, prices],
  );

  const coinLabel =
    SUPPORTED_COINS.find((c) => c.id === form.coinId)?.label ?? form.coinId;

  return (
    <div className={`grid gap-5 ${compact ? "" : "lg:grid-cols-[360px_1fr]"}`}>
      <Card className="p-5">
        <SimulatorForm state={form} onChange={setForm} disabled={isFetching} />
      </Card>

      <div className="grid min-w-0 content-start gap-4">
        {isError ? (
          <Card className="p-6 text-loss">
            {error instanceof Error ? error.message : "Erreur inattendue."}
          </Card>
        ) : (
          <>
            <ResultCards result={result} />
            <Card className="overflow-hidden p-4 sm:p-5">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-semibold">Évolution — {coinLabel}</h2>
                {isFetching && (
                  <span className="text-xs text-text-muted">Chargement…</span>
                )}
              </div>
              <EvolutionChart
                evolution={result.evolution}
                comparisonLabel={COMPARISON_LABEL}
              />
              <p className="mt-3 text-xs text-text-muted">
                Avec {COMPARISON_LABEL}, vous auriez{" "}
                <span className="text-accent">
                  {formatMoney(result.finalComparisonValue)}
                </span>
                . Simulation rétrospective sur données historiques réelles, à titre
                pédagogique — ne constitue pas un conseil en investissement.
              </p>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function initialForm(coinId: CoinId, amount: number): FormState {
  const end = startOfToday();
  const start = yearsBefore(end, DEFAULT_HISTORY_YEARS);
  return { coinId, amount, frequency: "monthly", startDate: start, endDate: end };
}
