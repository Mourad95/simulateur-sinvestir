"use client";

import { Field, SegmentedControl, TextInput } from "@/components/ui/primitives";
import { CoinCombobox } from "./CoinCombobox";
import type { Coin, CoinId, Frequency } from "@/domain/types";
import { toDateInputValue, fromDateInputValue } from "@/lib/format";

export type FormState = {
  coinId: CoinId;
  amount: number;
  frequency: Frequency;
  startDate: number;
  endDate: number;
};

const FREQUENCY_OPTIONS: readonly { value: Frequency; label: string }[] = [
  { value: "once", label: "Une fois" },
  { value: "weekly", label: "Hebdo" },
  { value: "monthly", label: "Mensuel" },
];

export function SimulatorForm({
  state,
  coins,
  onChange,
  disabled,
}: {
  state: FormState;
  coins: readonly Coin[];
  onChange: (next: FormState) => void;
  disabled: boolean;
}) {
  const patch = (partial: Partial<FormState>) => onChange({ ...state, ...partial });
  const amountLabel = state.frequency === "once" ? "Montant investi" : "Montant par apport";
  const amountUnit = "$";

  return (
    <div className="grid gap-5">
      <Field label="Cryptomonnaie">
        <CoinCombobox
          coins={coins}
          value={state.coinId}
          disabled={disabled}
          onChange={(coinId) => patch({ coinId })}
        />
      </Field>

      <Field label={`${amountLabel} (${amountUnit})`} htmlFor="amount">
        <TextInput
          id="amount"
          type="number"
          min={1}
          step={10}
          value={state.amount}
          disabled={disabled}
          onChange={(e) => patch({ amount: Math.max(1, Number(e.target.value)) })}
        />
      </Field>

      <Field label="Fréquence d'investissement">
        <SegmentedControl
          options={FREQUENCY_OPTIONS}
          value={state.frequency}
          onChange={(frequency) => patch({ frequency })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date de début" htmlFor="start">
          <TextInput
            id="start"
            type="date"
            value={toDateInputValue(state.startDate)}
            disabled={disabled}
            max={toDateInputValue(state.endDate)}
            onChange={(e) => patch({ startDate: fromDateInputValue(e.target.value) })}
          />
        </Field>
        <Field label="Date de fin" htmlFor="end">
          <TextInput
            id="end"
            type="date"
            value={toDateInputValue(state.endDate)}
            disabled={disabled}
            min={toDateInputValue(state.startDate)}
            onChange={(e) => patch({ endDate: fromDateInputValue(e.target.value) })}
          />
        </Field>
      </div>
    </div>
  );
}
