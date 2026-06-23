"use client";

import { useMemo, useState } from "react";
import { SimulatorForm, type FormState } from "./SimulatorForm";
import { SimulatorResult } from "./SimulatorResult";
import { Card } from "./ui/primitives";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { useCoins } from "@/hooks/useCoins";
import { runBacktest } from "@/domain/backtest";
import type { CoinId } from "@/domain/types";
import {
  COMPARISON_RATE,
  DEFAULT_HISTORY_YEARS,
  DEFAULT_COIN_ID,
  DEFAULT_AMOUNT,
} from "@/domain/constants";
import { startOfToday, yearsBefore } from "@/lib/time";

const EMPTY_PRICES = [] as const;

/**
 * Composant simulateur autonome et embeddable : orchestre le formulaire, le fetch
 * des prix et le backtest, puis délègue l'affichage à <SimulatorResult/>.
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

  const { coins } = useCoins();

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
    coins.find((coin) => coin.id === form.coinId)?.name ?? form.coinId;

  return (
    <div className={`grid gap-5 ${compact ? "" : "lg:grid-cols-[360px_1fr]"}`}>
      <Card className="p-5">
        <SimulatorForm
          state={form}
          coins={coins}
          onChange={setForm}
          disabled={isFetching}
        />
      </Card>

      <div className="grid min-w-0 content-start gap-4">
        <SimulatorResult
          result={result}
          coinLabel={coinLabel}
          isLoading={isFetching}
          errorMessage={isError ? errorMessage(error) : null}
        />
      </div>
    </div>
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erreur inattendue.";
}

function initialForm(coinId: CoinId, amount: number): FormState {
  const end = startOfToday();
  const start = yearsBefore(end, DEFAULT_HISTORY_YEARS);
  return { coinId, amount, frequency: "monthly", startDate: start, endDate: end };
}
