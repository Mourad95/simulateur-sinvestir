"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { SimulatorForm, type FormState } from "./SimulatorForm";
import { ResultCards } from "./ResultCards";
import { Card } from "./ui/primitives";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { runBacktest } from "@/domain/backtest";
import { SUPPORTED_COINS, type CoinId } from "@/domain/types";
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

/** Taux du placement de comparaison (Livret A, plafond 3% en référence). */
const COMPARISON_RATE = 0.03;
const COMPARISON_LABEL = "Livret A (3 %)";

const EMPTY_PRICES = [] as const;

/**
 * Composant simulateur autonome et embeddable.
 * Reçoit ses valeurs par défaut en props → réutilisable hors de cette app.
 */
export function Simulator({
  defaultCoinId = "BTC_USDT",
  defaultAmount = 100,
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
  // Période par défaut : 2 ans. Gate.io fournit ~1000 jours d'historique journalier
  // en une requête, on reste donc largement dans la fenêtre couverte.
  const end = startOfToday();
  const start = end - 2 * 365 * 24 * 60 * 60 * 1000;
  return { coinId, amount, frequency: "monthly", startDate: start, endDate: end };
}

/** Date du jour normalisée à minuit, pour des bornes stables. */
function startOfToday(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}
