"use client";

import { Field, SegmentedControl, Select, TextInput } from "@/components/ui/primitives";
import { SUPPORTED_COINS, type Frequency } from "@/domain/types";
import { toDateInputValue, fromDateInputValue } from "@/lib/format";

export type FormState = {
  coinId: string;
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
  onChange,
  disabled,
}: {
  state: FormState;
  onChange: (next: FormState) => void;
  disabled: boolean;
}) {
  const patch = (partial: Partial<FormState>) => onChange({ ...state, ...partial });
  const amountLabel = state.frequency === "once" ? "Montant investi" : "Montant par apport";
  const amountUnit = "$";

  return (
    <div className="grid gap-5">
      <Field label="Cryptomonnaie" htmlFor="coin">
        <Select
          id="coin"
          value={state.coinId}
          disabled={disabled}
          onChange={(e) => patch({ coinId: e.target.value })}
        >
          {SUPPORTED_COINS.map((coin) => (
            <option key={coin.id} value={coin.id}>
              {coin.label} ({coin.symbol})
            </option>
          ))}
        </Select>
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
