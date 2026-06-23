"use client";

import dynamic from "next/dynamic";
import { ResultCards } from "./ResultCards";
import { Card } from "./ui/primitives";
import { COMPARISON_LABEL } from "@/domain/constants";
import { formatMoney } from "@/lib/format";
import type { SimulationResult } from "@/domain/types";

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

/**
 * Panneau de résultats : KPIs + graphique d'évolution, ou message d'erreur.
 * Purement présentationnel — reçoit le résultat déjà calculé.
 */
export function SimulatorResult({
  result,
  coinLabel,
  isLoading,
  errorMessage,
}: {
  result: SimulationResult;
  coinLabel: string;
  isLoading: boolean;
  errorMessage: string | null;
}) {
  if (errorMessage) {
    return <Card className="p-6 text-loss">{errorMessage}</Card>;
  }

  return (
    <>
      <ResultCards result={result} />
      <Card className="overflow-hidden p-4 sm:p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold">Évolution — {coinLabel}</h2>
          {isLoading && <span className="text-xs text-text-muted">Chargement…</span>}
        </div>
        <EvolutionChart evolution={result.evolution} comparisonLabel={COMPARISON_LABEL} />
        <p className="mt-3 text-xs text-text-muted">
          Avec {COMPARISON_LABEL}, vous auriez{" "}
          <span className="text-accent">{formatMoney(result.finalComparisonValue)}</span>.
          Simulation rétrospective sur données historiques réelles, à titre pédagogique —
          ne constitue pas un conseil en investissement.
        </p>
      </Card>
    </>
  );
}
