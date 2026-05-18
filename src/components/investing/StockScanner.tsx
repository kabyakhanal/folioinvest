import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Search, TrendingUp, TrendingDown, Minus, Shuffle, Eye, BookOpen, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { scanStock, type StockScannerResult } from "@/lib/ai.functions";
import { toast } from "sonner";

const SENTIMENT_META: Record<string, { color: string; bg: string; border: string; Icon: typeof TrendingUp }> = {
  Bullish: { color: "text-[var(--success)]", bg: "bg-[oklch(0.72_0.17_150_/_0.1)]", border: "border-[oklch(0.72_0.17_150_/_0.3)]", Icon: TrendingUp },
  Bearish: { color: "text-[var(--danger)]", bg: "bg-[oklch(0.68_0.21_25_/_0.1)]", border: "border-[oklch(0.68_0.21_25_/_0.3)]", Icon: TrendingDown },
  Mixed: { color: "text-[var(--warning)]", bg: "bg-[oklch(0.78_0.16_75_/_0.1)]", border: "border-[oklch(0.78_0.16_75_/_0.3)]", Icon: Shuffle },
  Neutral: { color: "text-muted-foreground", bg: "bg-muted/30", border: "border-border", Icon: Minus },
};

const SUGGESTIONS = ["NVDA", "AAPL", "TSLA", "MSFT", "AMZN", "META"];

function fmtNum(n: number | null, digits = 2) {
  if (n == null) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}
function fmtBig(n: number | null) {
  if (n == null) return "—";
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  return n.toLocaleString();
}

export function StockScanner() {
  const [ticker, setTicker] = useState("");
  const fn = useServerFn(scanStock);

  const mutation = useMutation({
    mutationFn: (t: string) => fn({ data: { ticker: t } }),
    onError: (e: Error) => toast.error(e.message),
  });

  const scan = (t?: string) => {
    const q = (t ?? ticker).trim().toUpperCase();
    if (!q) {
      toast.error("Enter a ticker to scan");
      return;
    }
    if (t) setTicker(t);
    mutation.mutate(q);
  };

  const result = mutation.data as StockScannerResult | undefined;
  const meta = result ? SENTIMENT_META[result.sentiment] ?? SENTIMENT_META.Neutral : null;
  const changeColor =
    result?.change_pct == null ? "text-muted-foreground" :
    result.change_pct >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]";

  // 52-week position 0–100
  const wkPos =
    result?.week52_low != null && result?.week52_high != null && result?.price != null && result.week52_high > result.week52_low
      ? ((result.price - result.week52_low) / (result.week52_high - result.week52_low)) * 100
      : null;

  return (
    <div className="space-y-5">
      <Card className="p-5 bg-[var(--surface)] border-border/40">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 bg-background/50 uppercase tracking-wider font-semibold"
              placeholder="Enter ticker (NVDA, AAPL, TSLA…)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && scan()}
              maxLength={10}
            />
          </div>
          <Button onClick={() => scan()} disabled={mutation.isPending || !ticker.trim()} variant="brand">
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Scan"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => scan(s)} className="text-xs px-2.5 py-1 rounded-full bg-background/50 border border-border/40 hover:border-[var(--brand)]/50 hover:text-foreground text-muted-foreground transition font-mono">
              {s}
            </button>
          ))}
        </div>
      </Card>

      {result && meta && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Live quote header */}
          <Card className="p-5 bg-[var(--surface)] border-border/40">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-2xl font-bold tracking-tight">{result.ticker}</h3>
                  <Badge variant="outline" className="text-[10px]">{result.currency}</Badge>
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Activity className="h-3 w-3" /> Live
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 truncate max-w-md">{result.company_name}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">${fmtNum(result.price)}</p>
                <p className={`text-sm font-medium ${changeColor}`}>
                  {result.change_pct != null ? (result.change_pct >= 0 ? "+" : "") + result.change_pct + "% today" : "—"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <Stat label="Day Low" value={"$" + fmtNum(result.day_low)} />
              <Stat label="Day High" value={"$" + fmtNum(result.day_high)} />
              <Stat label="52W Range" value={`$${fmtNum(result.week52_low, 0)} – $${fmtNum(result.week52_high, 0)}`} />
              <Stat label="Market Cap" value={fmtBig(result.market_cap)} />
            </div>

            {wkPos != null && (
              <div className="mt-4">
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  <span>52W Low</span><span>Position</span><span>52W High</span>
                </div>
                <div className="relative h-1.5 rounded-full bg-muted overflow-visible">
                  <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-[var(--danger)]/40 via-[var(--warning)]/40 to-[var(--success)]/40 rounded-full" />
                  <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-foreground shadow ring-2 ring-background" style={{ left: `calc(${Math.max(0, Math.min(100, wkPos))}% - 6px)` }} />
                </div>
              </div>
            )}
          </Card>

          {/* Sentiment */}
          <Card className={`p-5 ${meta.bg} ${meta.border}`}>
            <div className="flex items-start gap-4">
              <div className={`h-12 w-12 rounded-full bg-background/40 flex items-center justify-center ${meta.color} shrink-0`}>
                <meta.Icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className={`text-2xl font-bold ${meta.color}`}>{result.sentiment}</h3>
                  <Badge variant="outline">Score: {result.score > 0 ? "+" : ""}{result.score}</Badge>
                </div>
                <p className="text-sm italic text-foreground/80 mt-2">"{result.headline}"</p>
                <p className="text-sm leading-relaxed mt-3">{result.narrative}</p>
              </div>
            </div>
            <div className="mt-4 h-1.5 rounded-full bg-background/40 overflow-hidden relative">
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border/60" />
              <div
                className={`h-full transition-all duration-700 ${result.score >= 0 ? "bg-[var(--success)]" : "bg-[var(--danger)]"}`}
                style={{
                  width: `${Math.abs(result.score) / 2}%`,
                  marginLeft: result.score >= 0 ? "50%" : `${50 - Math.abs(result.score) / 2}%`,
                }}
              />
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5 bg-[var(--surface)] border-border/40">
              <h4 className="font-semibold text-[var(--success)] mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4" />Positive Drivers</h4>
              <ul className="space-y-2.5">
                {result.positives?.map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] mt-0.5 shrink-0">{p.impact}</Badge>
                    <span className="text-sm">{p.point}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-5 bg-[var(--surface)] border-border/40">
              <h4 className="font-semibold text-[var(--danger)] mb-3 flex items-center gap-2"><TrendingDown className="h-4 w-4" />Concerns</h4>
              <ul className="space-y-2.5">
                {result.negatives?.map((n, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Badge variant="outline" className="text-[10px] mt-0.5 shrink-0">{n.impact}</Badge>
                    <span className="text-sm">{n.point}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="p-5 bg-[var(--surface)] border-border/40">
            <h4 className="font-semibold mb-2 text-sm">What this means for you</h4>
            <p className="text-sm leading-relaxed text-foreground/90">{result.what_it_means}</p>
            {result.watch_for?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/40">
                <div className="flex items-center gap-2 mb-2"><Eye className="h-4 w-4 text-[var(--brand)]" /><p className="text-xs uppercase tracking-wider text-muted-foreground">Upcoming catalysts</p></div>
                <ul className="space-y-1">
                  {result.watch_for.map((w, i) => <li key={i} className="text-sm">• {w}</li>)}
                </ul>
              </div>
            )}
          </Card>

          {result.glossary && (
            <Card className="p-5 bg-gradient-to-br from-[oklch(0.7_0.18_295_/_0.08)] to-[oklch(0.68_0.16_250_/_0.08)] border-[var(--brand)]/20">
              <div className="flex items-center gap-2 mb-2"><BookOpen className="h-4 w-4 text-[var(--brand)]" /><h4 className="font-semibold">{result.glossary.term}</h4></div>
              <p className="text-sm leading-relaxed text-foreground/90">{result.glossary.definition}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/40 border border-border/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5 truncate">{value}</p>
    </div>
  );
}
