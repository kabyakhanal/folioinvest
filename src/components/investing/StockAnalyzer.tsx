import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, Loader2, Sparkles, Target, AlertTriangle, BookOpen, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { analyzeStock, fetchStockFundamentals, fetchStockQuote, type StockAnalysis } from "@/lib/ai.functions";
import { PriceHistoryChart } from "./PriceHistoryChart";
import { toast } from "sonner";

type Fundamentals = {
  price: number | null;
  eps: number | null;
  revenue_billions: number | null;
  sector: string | null;
  company_name: string | null;
  source: "yahoo" | "ai" | null;
};

export function StockAnalyzer() {
  const [ticker, setTicker] = useState("");
  const [fund, setFund] = useState<Fundamentals>({
    price: null, eps: null, revenue_billions: null, sector: null, company_name: null, source: null,
  });
  const [autofilling, setAutofilling] = useState(false);

  const fetchQuote = useServerFn(fetchStockQuote);
  const fetchFundamentals = useServerFn(fetchStockFundamentals);
  const analyze = useServerFn(analyzeStock);

  useEffect(() => {
    if (!ticker || ticker.length < 1) {
      setFund({ price: null, eps: null, revenue_billions: null, sector: null, company_name: null, source: null });
      return;
    }
    const t = setTimeout(async () => {
      setAutofilling(true);
      try {
        const [quote, f] = await Promise.all([
          fetchQuote({ data: { ticker } }).catch(() => null),
          fetchFundamentals({ data: { ticker } }).catch(() => null),
        ]);
        setFund({
          price: quote?.price ?? null,
          eps: f?.eps ?? null,
          revenue_billions: f?.revenue_billions ?? null,
          sector: f?.sector ?? null,
          company_name: quote?.name ?? f?.company_name ?? null,
          source: f?.source ?? null,
        });
      } finally {
        setAutofilling(false);
      }
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  const mutation = useMutation({
    mutationFn: (vars: { ticker: string; price: number; eps?: number; revenue?: number; sector?: string }) =>
      analyze({ data: vars }),
    onError: (e: Error) => toast.error(e.message),
  });

  const onAnalyze = () => {
    if (!ticker) return toast.error("Enter a ticker");
    if (!fund.price) return toast.error("Could not fetch live price for this ticker");
    mutation.mutate({
      ticker,
      price: fund.price,
      eps: fund.eps ?? undefined,
      revenue: fund.revenue_billions ?? undefined,
      sector: fund.sector ?? undefined,
    });
  };

  const result = mutation.data as StockAnalysis | undefined;
  const verdictMeta: Record<string, { icon: typeof TrendingUp; color: string; bg: string }> = {
    Undervalued: { icon: TrendingUp, color: "text-[var(--success)]", bg: "bg-[oklch(0.72_0.17_150_/_0.12)]" },
    "Fairly Valued": { icon: Minus, color: "text-[var(--warning)]", bg: "bg-[oklch(0.78_0.16_75_/_0.12)]" },
    Overvalued: { icon: TrendingDown, color: "text-[var(--danger)]", bg: "bg-[oklch(0.68_0.21_25_/_0.12)]" },
  };
  const vMeta = result ? verdictMeta[result.verdict] ?? verdictMeta["Fairly Valued"] : null;

  return (
    <div className="space-y-5">
      <Card className="p-5 bg-[var(--surface)] border-border/40">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          Ticker {autofilling && <Loader2 className="h-3 w-3 animate-spin" />}
        </Label>
        <Input
          placeholder="AAPL, MSFT, NVDA…"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          className="mt-1.5 text-lg font-semibold bg-background/50"
        />
        {fund.company_name && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2 flex-wrap">
            {fund.company_name}
            {fund.source === "yahoo" && <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[oklch(0.72_0.17_150_/_0.15)] text-[var(--success)] border border-[oklch(0.72_0.17_150_/_0.3)]">● Live data</span>}
            {fund.source === "ai" && <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[oklch(0.78_0.16_75_/_0.15)] text-[var(--warning)] border border-[oklch(0.78_0.16_75_/_0.3)]">AI estimate · verify</span>}
          </p>
        )}

        {(fund.price != null || fund.eps != null || fund.revenue_billions != null || fund.sector) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            <Stat label="Price" value={fund.price != null ? `$${fund.price.toFixed(2)}` : "—"} />
            <Stat label="EPS (TTM)" value={fund.eps ? fund.eps.toFixed(2) : "—"} />
            <Stat label="Revenue" value={fund.revenue_billions ? `$${fund.revenue_billions}B` : "—"} />
            <Stat label="Sector" value={fund.sector ?? "—"} />
          </div>
        )}

        <Button onClick={onAnalyze} disabled={mutation.isPending || !ticker || !fund.price || autofilling} variant="brand" className="w-full mt-5">
          {mutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Running deep analysis…</> : <><Sparkles className="h-4 w-4 mr-2" />Analyze Stock</>}
        </Button>
      </Card>

      {result && vMeta && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="p-5 bg-[var(--surface)] border-border/40">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-2xl font-bold">{ticker}</h3>
                  <Badge className={`${vMeta.bg} ${vMeta.color} border-0`}>
                    <vMeta.icon className="h-3 w-3 mr-1" />{result.verdict}
                  </Badge>
                  <Badge variant="outline">Confidence: {result.confidence}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">{result.summary}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Score</p>
                <p className="text-3xl font-bold bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] bg-clip-text text-transparent">{result.score}<span className="text-lg text-muted-foreground">/10</span></p>
                <p className="text-xs text-muted-foreground mt-1">Fair value: <span className="text-foreground font-medium">${result.fair_value_estimate}</span></p>
              </div>
            </div>
            <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[var(--brand-2)] to-[var(--brand)] transition-all duration-700" style={{ width: `${(result.score / 10) * 100}%` }} />
            </div>
          </Card>

          <PriceHistoryChart ticker={ticker} />

          {result.key_metrics?.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {result.key_metrics.slice(0, 4).map((m, i) => (
                <Card key={i} className="p-3 bg-[var(--surface)] border-border/40">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
                  <p className="text-lg font-semibold mt-1">{m.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{m.note}</p>
                </Card>
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5 bg-[oklch(0.72_0.17_150_/_0.06)] border-[oklch(0.72_0.17_150_/_0.2)]">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-[var(--success)]" /><h4 className="font-semibold text-[var(--success)]">Bull Thesis</h4></div>
              <p className="text-sm leading-relaxed text-foreground/90">{result.thesis}</p>
            </Card>
            <Card className="p-5 bg-[oklch(0.68_0.21_25_/_0.06)] border-[oklch(0.68_0.21_25_/_0.2)]">
              <div className="flex items-center gap-2 mb-2"><TrendingDown className="h-4 w-4 text-[var(--danger)]" /><h4 className="font-semibold text-[var(--danger)]">Bear Case</h4></div>
              <p className="text-sm leading-relaxed text-foreground/90">{result.bear_case}</p>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5 bg-[var(--surface)] border-border/40">
              <div className="flex items-center gap-2 mb-3"><Target className="h-4 w-4 text-[var(--brand)]" /><h4 className="font-semibold">What to Watch For</h4></div>
              <ul className="space-y-3">
                {result.watch_for?.map((w, i) => (
                  <li key={i} className="border-l-2 border-[var(--brand)]/40 pl-3">
                    <p className="text-sm font-medium">{w.signal}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{w.why}</p>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-5 bg-[var(--surface)] border-border/40">
              <div className="flex items-center gap-2 mb-3"><AlertTriangle className="h-4 w-4 text-[var(--warning)]" /><h4 className="font-semibold">What to Watch Out For</h4></div>
              <ul className="space-y-3">
                {result.watch_out_for?.map((w, i) => (
                  <li key={i} className="border-l-2 border-[var(--warning)]/40 pl-3">
                    <p className="text-sm font-medium">{w.risk}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{w.why}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="p-5 bg-[var(--surface)] border-border/40">
            <div className="flex items-center gap-2 mb-2"><Shield className="h-4 w-4 text-[var(--brand-2)]" /><h4 className="font-semibold">Competitive Moat</h4></div>
            <p className="text-sm leading-relaxed text-foreground/90">{result.competitive_moat}</p>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-[oklch(0.7_0.18_295_/_0.08)] to-[oklch(0.68_0.16_250_/_0.08)] border-[var(--brand)]/20">
            <div className="flex items-center gap-2 mb-2"><BookOpen className="h-4 w-4 text-[var(--brand)]" /><h4 className="font-semibold">Lesson</h4></div>
            <p className="text-sm leading-relaxed text-foreground/90">{result.lesson}</p>
          </Card>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/40 bg-background/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5 truncate">{value}</p>
    </div>
  );
}
