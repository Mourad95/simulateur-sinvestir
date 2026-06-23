"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate, formatMoney } from "@/lib/format";
import type { EvolutionPoint } from "@/domain/types";

const COLORS = {
  crypto: "#1098f7",
  invested: "#9ca3af",
  comparison: "#f8d047",
} as const;

export function EvolutionChart({
  evolution,
  comparisonLabel,
}: {
  evolution: readonly EvolutionPoint[];
  comparisonLabel: string;
}) {
  return (
    // Le parent a sa taille fixée par le CSS : Recharts mesure ce conteneur (et non
    // l'inverse), ce qui évite qu'il fige une largeur trop grande au 1er rendu mobile.
    <div className="relative h-[320px] w-full overflow-hidden">
      <div className="absolute inset-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart
            data={evolution as EvolutionPoint[]}
            margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
          >
            <defs>
              <linearGradient id="cryptoFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.crypto} stopOpacity={0.35} />
                <stop offset="100%" stopColor={COLORS.crypto} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatDate}
              stroke="#9ca3af"
              fontSize={12}
              minTickGap={40}
            />
            <YAxis
              tickFormatter={(v: number) => formatMoney(v)}
              stroke="#9ca3af"
              fontSize={12}
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#00173f",
                border: "1px solid #1e293b",
                borderRadius: 8,
                color: "#fff",
              }}
              labelFormatter={(ts) => formatDate(Number(ts))}
              formatter={(value, name) => [formatMoney(Number(value)), String(name)]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />

            <Area
              type="monotone"
              dataKey="cryptoValue"
              name="Valeur crypto"
              stroke={COLORS.crypto}
              strokeWidth={2}
              fill="url(#cryptoFill)"
              isAnimationActive={false}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="invested"
              name="Investi"
              stroke={COLORS.invested}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="comparisonValue"
              name={comparisonLabel}
              stroke={COLORS.comparison}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
