import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Plus, Sparkles, Trash2, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fetchStockQuote, portfolioInsight, type PortfolioInsight } from "@/lib/ai.functions";
import { toast } from "sonner";

type Holding = { ticker: string; shares: number; buyPrice: number; currentPrice: number };

const COLORS = ["#a855f7", "#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"];

export function PortfolioTracker() {
  const [holdings, setHoldings] = useState<Holding[]>([
    { ticker: "AAPL", shares: 10, buyPrice: 170, currentPrice: 185 },
    { ticker: "MSFT", shares: 5, buyPrice: 380, currentPrice: 410 },
    { ticker: "NVDA", shares: 8, buyPrice: 450, currentPrice: 880 },
  ]);
  const [newTicker, setNewTicker] = useState("");
  const [newShares, setNewShares] = useState("");
  const [newBuy, setNewBuy] = useState("");
  const [newCurrent, setNewCurrent] = useState("");
  const [fetching, setFetching] = useState(false);

  const fetchQuote = useServerFn(fetchStockQuote);
  const insightFn = useServerFn(portfolioInsight);

  useEffect(() => {
    if (!newTicker || newTicker.length < 1) return;
    const t = setTimeout(async () => {
      setFetching(true);
      try {
        const q = await fetchQuote({ data: { ticker: newTicker } });
        if (q?.price) setNewCurrent(String(q.price));
      } finally {
        setFetching(false);
      }
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTicker]);

  const addHolding = () => {
    if (!newTicker || !newShares || !newBuy || !newCurrent) {
      toast.error("Fill all fields");
      return;
    }
    setHoldings([...holdings, {
      ticker: newTicker.toUpperCase(),
      shares: parseFloat(newShares),
      buyPrice: parseFloat(newBuy),
      currentPrice: parseFloat(newCurrent),
    }]);
    setNewTicker(""); setNewShares(""); setNewBuy(""); setNewCurrent("");
  };

  const removeHolding = (i: number) => setHoldings(holdings.filter((_, idx) => idx !== i));

  const refreshPrice = async (i: number) => {
    const h = holdings[i];
    const q = await fetchQuote({ data: { ticker: h.ticker } });
    if (q?.price) {
      const next = [...holdings];
      next[i] = { ...h, currentPrice: q.price };
      setHoldings(next);
      toast.success(`${h.ticker} updated to $${q.price}`);
    } else toast.error("Could not fetch price");
  };

  const totalValue = holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0);
  const totalCost = holdings.reduce((s, h) => s + h.shares * h.buyPrice, 0);
  const totalGain = totalValue - totalCost;
  const totalPct = totalCost ? ((totalGain / totalCost) * 100).toFixed(2) : "0";

  const chartData = holdings.map((h) => ({
    name: h.ticker,
    value: Number((h.shares * h.currentPrice).toFixed(2)),
    pct: totalValue ? ((h.shares * h.currentPrice) / totalValue) * 100 : 0,
  }));

  const insightMutation = useMutation({
    mutationFn: () => insightFn({ data: { holdings } }),
    onError: (e: Error) => toast.error(e.message),
  });
  const insight = insightMutation.data as PortfolioInsight | undefined;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total Value" value={`$${totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} />
        <Stat label="Total Cost" value={`$${totalCost.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} />
        <Stat
          label="Total Gain"
          value={`${totalGain >= 0 ? "+" : "−"}$${Math.abs(totalGain).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          sub={`${totalGain >= 0 ? "+" : ""}${totalPct}%`}
          accent={totalGain >= 0 ? "success" : "danger"}
        />
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        <Card className="p-5 bg-[var(--surface)] border-border/40 md:col-span-2">
          <h4 className="text-sm font-semibold mb-3">Allocation</h4>
          {holdings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">Add a holding to see allocation</p>
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "oklch(0.21 0.025 270)", border: "1px solid oklch(0.3 0.02 270)", borderRadius: 10, fontSize: 12 }}
                    formatter={(v: number, _n, p) => [`$${v.toLocaleString()} (${p.payload.pct.toFixed(1)}%)`, p.payload.name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-3 space-y-1.5">
            {chartData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="font-medium">{d.name}</span>
                </div>
                <span className="text-muted-foreground">{d.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-0 bg-[var(--surface)] border-border/40 md:col-span-3 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground bg-background/30">
                  {["Ticker", "Shares", "Buy", "Current", "Value", "P/L", ""].map((h) => (
                    <th key={h} className="px-3 py-2.5 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((h, i) => {
                  const val = h.shares * h.currentPrice;
                  const pct = ((h.currentPrice - h.buyPrice) / h.buyPrice * 100);
                  const positive = pct >= 0;
                  return (
                    <tr key={i} className="border-t border-border/30">
                      <td className="px-3 py-2.5 font-semibold flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        {h.ticker}
                      </td>
                      <td className="px-3 py-2.5">{h.shares}</td>
                      <td className="px-3 py-2.5">${h.buyPrice}</td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => refreshPrice(i)} className="text-foreground/90 hover:text-[var(--brand)] transition" title="Refresh">
                          ${h.currentPrice}
                        </button>
                      </td>
                      <td className="px-3 py-2.5">${val.toFixed(0)}</td>
                      <td className={`px-3 py-2.5 font-medium ${positive ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                        {positive ? "+" : ""}{pct.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => removeHolding(i)} className="text-muted-foreground hover:text-[var(--danger)] transition">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="p-4 bg-[var(--surface)] border-border/40">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              Ticker {fetching && <Loader2 className="h-3 w-3 animate-spin" />}
            </Label>
            <Input className="mt-1.5 bg-background/50" placeholder="GOOG" value={newTicker} onChange={(e) => setNewTicker(e.target.value.toUpperCase())} />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Shares</Label>
            <Input className="mt-1.5 bg-background/50" type="number" placeholder="10" value={newShares} onChange={(e) => setNewShares(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Buy $</Label>
            <Input className="mt-1.5 bg-background/50" type="number" placeholder="150" value={newBuy} onChange={(e) => setNewBuy(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Current $</Label>
            <Input className="mt-1.5 bg-background/50" type="number" placeholder="160" value={newCurrent} onChange={(e) => setNewCurrent(e.target.value)} />
          </div>
          <Button onClick={addHolding} variant="outline"><Plus className="h-4 w-4 mr-1" />Add</Button>
        </div>
      </Card>

      <Button onClick={() => insightMutation.mutate()} disabled={insightMutation.isPending || holdings.length === 0} variant="brand" className="w-full">
        {insightMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing portfolio…</> : <><Sparkles className="h-4 w-4 mr-2" />Get AI Portfolio Insight</>}
      </Button>

      {insight && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 bg-[var(--surface)] border-border/40">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Diversification</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-bold">{insight.diversification_score}<span className="text-base text-muted-foreground">/10</span></p>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[var(--brand-2)] to-[var(--brand)]" style={{ width: `${(insight.diversification_score / 10) * 100}%` }} />
              </div>
            </Card>
            <Card className="p-4 bg-[var(--surface)] border-border/40">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Concentration Risk</p>
              <Badge className="mt-2" variant={insight.concentration_risk === "High" ? "destructive" : "outline"}>
                {insight.concentration_risk}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{insight.sector_skew}</p>
            </Card>
          </div>

          <Card className="p-5 bg-[var(--surface)] border-border/40">
            <p className="text-sm leading-relaxed">{insight.summary}</p>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5 bg-[oklch(0.72_0.17_150_/_0.06)] border-[oklch(0.72_0.17_150_/_0.2)]">
              <h4 className="font-semibold text-[var(--success)] mb-2 text-sm">Strengths</h4>
              <ul className="space-y-1.5">{insight.strengths?.map((s, i) => <li key={i} className="text-sm">• {s}</li>)}</ul>
            </Card>
            <Card className="p-5 bg-[oklch(0.78_0.16_75_/_0.06)] border-[oklch(0.78_0.16_75_/_0.2)]">
              <h4 className="font-semibold text-[var(--warning)] mb-2 text-sm">Weaknesses</h4>
              <ul className="space-y-1.5">{insight.weaknesses?.map((s, i) => <li key={i} className="text-sm">• {s}</li>)}</ul>
            </Card>
          </div>

          <Card className="p-5 bg-gradient-to-br from-[oklch(0.7_0.18_295_/_0.08)] to-[oklch(0.68_0.16_250_/_0.08)] border-[var(--brand)]/20">
            <div className="flex items-center gap-2 mb-3"><TrendingUp className="h-4 w-4 text-[var(--brand)]" /><h4 className="font-semibold">Recommended Actions</h4></div>
            <ul className="space-y-3">
              {insight.actions?.map((a, i) => (
                <li key={i} className="border-l-2 border-[var(--brand)]/40 pl-3">
                  <p className="text-sm font-medium">{a.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.rationale}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: "success" | "danger" }) {
  const color = accent === "success" ? "text-[var(--success)]" : accent === "danger" ? "text-[var(--danger)]" : "";
  return (
    <Card className="p-4 bg-[var(--surface)] border-border/40">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${color}`}>{sub}</p>}
    </Card>
  );
}
