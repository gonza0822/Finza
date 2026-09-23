"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatYearMonthChartEsAr, formatYearMonthEsAr } from "@/lib/dates/isoDate";
import { formatAmountEsAr, formatMoney } from "@/lib/money/format";
import { proyeccionContent } from "@/lib/content/proyeccion";
import type { Currency } from "@/lib/db/enums";
import type { ProjectionMonth } from "@/features/proyeccion/types";

interface ProjectionChartProps {
  currency: Currency;
  months: ProjectionMonth[];
}

interface ChartRow {
  tick: string;
  full: string;
  cash: number;
  netWorth: number;
}

/** End-of-month cash and net worth; theme colors, no default demo palette. */
export function ProjectionChart({ currency, months }: ProjectionChartProps) {
  const data: ChartRow[] = months.map((month) => ({
    tick: formatYearMonthChartEsAr(month.yearMonth),
    full: formatYearMonthEsAr(month.yearMonth),
    cash: month.cashCents / 100,
    netWorth: month.netWorthCents / 100,
  }));

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 28, left: 4, bottom: 4 }}>
          <CartesianGrid stroke="rgba(23,70,67,0.12)" vertical={false} />
          <XAxis
            dataKey="tick"
            tick={{ fill: "#3A524F", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(23,70,67,0.2)" }}
            interval={0}
            minTickGap={8}
            height={28}
            padding={{ left: 12, right: 16 }}
          />
          <YAxis
            tick={{ fill: "#3A524F", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={72}
            tickFormatter={(value: number) => formatAmountEsAr(Math.round(value * 100))}
          />
          <Tooltip
            formatter={(value, name) => {
              const cents = Math.round(Number(value) * 100);
              const label =
                name === "cash" ? proyeccionContent.cashSeries : proyeccionContent.netWorthSeries;
              return [formatMoney(cents, currency), label];
            }}
            labelFormatter={(label, payload) => {
              const row = payload?.[0]?.payload as ChartRow | undefined;
              return row?.full ?? String(label);
            }}
            contentStyle={{
              background: "#FFFCF7",
              border: "1px solid rgba(23,70,67,0.12)",
              borderRadius: 16,
            }}
          />
          <Legend
            formatter={(value) =>
              value === "cash" ? proyeccionContent.cashSeries : proyeccionContent.netWorthSeries
            }
          />
          <Line
            type="monotone"
            dataKey="cash"
            stroke="#174643"
            strokeWidth={2}
            dot={{ r: 3, fill: "#174643" }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="netWorth"
            stroke="#2A9D8F"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={{ r: 3, fill: "#2A9D8F" }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
