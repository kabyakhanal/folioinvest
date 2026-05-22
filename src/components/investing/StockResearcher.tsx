import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Search, Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { researchStocks, type ResearchEnriched } from "@/lib/ai.functions";
import { toast } from "sonner";

const EXAMPLES = [
  "Compare NVDA vs AMD",
  "Is TSLA overvalued in 2026?",
  "MSFT vs GOOGL for AI exposure",
  "What's the bull case for PLTR?",
  "AAPL vs META — which is the better long term hold?",
];

function fmt(n: number | null, d = 2) {
  if (n == null) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: d });
}

function QuoteCard({ q }: { q: ResearchEnriched }) {
  const up = (q.change_pct ?? 0) >= 0;
  const yrUp = (q.one_year_pct ?? 0) >= 0;
  return (
    <div className="rounded-xl border border-border/60 bg-[var(--surface)] p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold text-base">{q.ticker}</div>
          <div className="text-xs text-muted-foreground truncate">{q.name}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold">${fmt(q.price)}</div>
          <div className={`text-xs flex items-center gap-1 justify-end ${up ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {q.change_pct == null ? "—" : `${up ? "+" : ""}${q.change_pct}%`}
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="text-muted-foreground">
          1y: <span className={yrUp ? "text-[var(--success)]" : "text-[var(--danger)]"}>{q.one_year_pct == null ? "—" : `${yrUp ? "+" : ""}${q.one_year_pct}%`}</span>
        </div>
        <div className="text-muted-foreground text-right">
          52w: {fmt(q.week52_low)}–{fmt(q.week52_high)}
        </div>
      </div>
    </div>
  );
}

export function StockResearcher() {
  const [query, setQuery] = useState("");
  const research = useServerFn(researchStocks);

  const m = useMutation({
    mutationFn: (q: string) => research({ data: { query: q } }),
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return toast.error("Type a stock research question");
    setQuery(trimmed);
    m.mutate(trimmed);
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6 bg-[var(--surface)] border-border/60">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--brand-2)] to-[var(--brand)] flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold leading-tight">Stock Researcher</h2>
            <p className="text-xs text-muted-foreground leading-tight">Ask any stock question — comparisons, deep dives, valuation, catalysts.</p>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); submit(query); }}
          className="mt-4 flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Compare NVDA vs AMD, or: Is TSLA overvalued?"
              className="pl-9 h-11"
              maxLength={400}
            />
          </div>
          <Button type="submit" disabled={m.isPending} className="h-11 px-5 bg-gradient-to-r from-[var(--brand-2)] to-[var(--brand)] text-white">
            {m.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Researching…</> : "Research"}
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => submit(ex)}
              disabled={m.isPending}
              className="text-[11px] px-2.5 py-1 rounded-full border border-border/60 bg-background/40 text-muted-foreground hover:text-foreground hover:border-[var(--brand)]/40 transition disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>
      </Card>

      {m.isPending && (
        <Card className="p-8 bg-[var(--surface)] border-border/60 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Pulling live quotes and synthesizing research…</span>
        </Card>
      )}

      {m.data && !m.isPending && (
        <>
          {m.data.enriched.length > 0 && (
            <div className={`grid gap-3 ${m.data.enriched.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
              {m.data.enriched.map((q) => <QuoteCard key={q.ticker} q={q} />)}
            </div>
          )}

          <Card className="p-5 sm:p-7 bg-[var(--surface)] border-border/60">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="text-[10px]">
                {m.data.isCompare ? "Comparative research" : "Deep dive"}
              </Badge>
              {m.data.enriched.length > 0 && (
                <Badge className="text-[10px] bg-[oklch(0.72_0.17_150_/_0.15)] text-[var(--success)] border-[oklch(0.72_0.17_150_/_0.3)]">
                  ● Live data
                </Badge>
              )}
            </div>
            <article className="prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2 prose-p:leading-relaxed prose-table:text-sm prose-th:bg-muted/40 prose-td:align-top">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.data.markdown}</ReactMarkdown>
            </article>
          </Card>
        </>
      )}
    </div>
  );
}
