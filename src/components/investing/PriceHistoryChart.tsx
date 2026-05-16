import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Brush } from "recharts";
import { Loader2, LineChart as LineIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchStockHistory } from "@/lib/ai.functions";

const RANGES = [
  { key: "1mo", label: "1M" },
  { key: "3mo", label: "3M" },
  { key: "6mo", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "5y", label: "5Y" },
  { key: "max", label: "Max" },
] as const;

export function PriceHistoryChart({ ticker }: { ticker: string }) {
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("1y");
  const fetchHistory = useServerFn(fetchStockHistory);

  const { data, isFetching } = useQuery({
    queryKey: ["stock-history", ticker, range],
    queryFn: () => fetchHistory({ data: { ticker, range } }),
    enabled: !!ticker,
    staleTime: 5 * 60_000,
  });

  const points = data?.points ?? [];
  const { first, last, change, pct, up } = useMemo(() => {
    if (points.length < 2) return { first: 0, last: 0, change: 0, pct: 0, up: true };
    const f = points[0].price;
    const l = points[points.length - 1].price;
    return { first: f, last: l, change: l - f, pct: ((l - f) / f) * 100, up: l >= f };
  }, [points]);

  const stroke = up ? "oklch(0.72 0.17 150)" : "oklch(0.68 0.21 25)";
  const fmtDate = (t: number) => {
    const d = new Date(t);
    return range === "1mo" || range === "3mo"
      ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  };

  return (
    <Card className="p-5 bg-[var(--surface)] border-border/40">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <div className="flex items-center gap-2">
            <LineIcon className="h-4 w-4 text-[var(--brand)]" />
            <h4 className="font-semibold">Price history</h4>
            {isFetching && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
          {points.length >= 2 && (
            <p className="text-xs text-muted-foreground mt-1">
              ${first.toFixed(2)} → <span className="text-foreground font-medium">${last.toFixed(2)}</span>{" "}
              <span style={{ color: stroke }}>
                {change >= 0 ? "+" : ""}{change.toFixed(2)} ({pct >= 0 ? "+" : ""}{pct.toFixed(2)}%)
              </span>
            </p>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          {RANGES.map((r) => (
            <Button
              key={r.key}
              size="sm"
              variant={range === r.key ? "brand" : "outline"}
              className="h-7 px-2.5 text-xs"
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        {points.length < 2 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            {isFetching ? "Loading chart…" : "No data available."}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis dataKey="t" tickFormatter={fmtDate} tick={{ fontSize: 11, fill: "oklch(1 0 0 / 0.55)" }} minTickGap={32} />
              <YAxis domain={["dataMin", "dataMax"]} tick={{ fontSize: 11, fill: "oklch(1 0 0 / 0.55)" }} tickFormatter={(v: number) => `$${v.toFixed(0)}`} width={48} />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8, fontSize: 12 }}
                labelFormatter={(t) => new Date(t as number).toLocaleDateString()}
                formatter={(v: number) => [`$${v.toFixed(2)}`, "Price"]}
              />
              <Area type="monotone" dataKey="price" stroke={stroke} strokeWidth={2} fill="url(#priceFill)" />
              <Brush dataKey="t" height={20} stroke={stroke} travellerWidth={8} tickFormatter={fmtDate} fill="oklch(1 0 0 / 0.04)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">Drag the handles below the chart to zoom into a date range.</p>
    </Card>
  );
}
