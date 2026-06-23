import { Card } from "@/components/ui/primitives";
import { formatMoney, formatPercent } from "@/lib/format";
import type { SimulationResult } from "@/domain/types";

export function ResultCards({ result }: { result: SimulationResult }) {
  const isGain = result.gainAmount >= 0;
  const valueColor = isGain ? "text-gain" : "text-loss";

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label="Total investi" value={formatMoney(result.totalInvested)} />
      <Kpi
        label="Valeur finale"
        value={formatMoney(result.finalCryptoValue)}
        valueClassName={valueColor}
      />
      <Kpi
        label="Plus / moins-value"
        value={`${isGain ? "+" : ""}${formatMoney(result.gainAmount)}`}
        sub={formatPercent(result.gainPercent)}
        valueClassName={valueColor}
      />
      <Kpi
        label="Perf. annualisée"
        value={formatPercent(result.annualizedReturn)}
        sub={`${result.contributionsCount} apport${result.contributionsCount > 1 ? "s" : ""}`}
        valueClassName={result.annualizedReturn >= 0 ? "text-gain" : "text-loss"}
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  valueClassName = "text-text",
}: {
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums lg:text-2xl ${valueClassName}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-sm tabular-nums text-text-muted">{sub}</p>}
    </Card>
  );
}
