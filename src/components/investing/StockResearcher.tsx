import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Search, Sparkles, TrendingUp, TrendingDown, RotateCcw, CornerDownLeft, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { researchStocks, followUpResearch, type ResearchEnriched } from "@/lib/ai.functions";
import { toast } from "sonner";

const EXAMPLES = [
  "Compare NVDA vs AMD",
  "Is TSLA overvalued in 2026?",
  "MSFT vs GOOGL for AI exposure",
  "What's the bull case for PLTR?",
];

const FOLLOWUP_SUGGESTIONS = [
  "What about valuation vs peers?",
  "What are the biggest near-term risks?",
  "How does this compare to 5 years ago?",
  "What would change the bull case?",
];

type Turn = { question: string; answer: string };

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

function MarkdownBlock({ text }: { text: string }) {
  return (
    <article className="prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2 prose-h3:text-base prose-p:leading-relaxed prose-table:text-sm prose-th:bg-muted/40 prose-td:align-top">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </article>
  );
}

export function StockResearcher() {
  const [query, setQuery] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [originalQuery, setOriginalQuery] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [enriched, setEnriched] = useState<ResearchEnriched[]>([]);
  const [isCompare, setIsCompare] = useState(false);

  const research = useServerFn(researchStocks);
  const followUpFn = useServerFn(followUpResearch);
  const lastAnswerRef = useRef<HTMLDivElement>(null);

  const startMut = useMutation({
    mutationFn: (q: string) => research({ data: { query: q } }),
    onSuccess: (res, q) => {
      setOriginalQuery(q);
      setTurns([{ question: q, answer: res.markdown }]);
      setEnriched(res.enriched);
      setIsCompare(res.isCompare);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const followMut = useMutation({
    mutationFn: (fu: string) =>
      followUpFn({
        data: {
          originalQuery,
          priorTurns: turns,
          followUp: fu,
          tickers: enriched.map((e) => e.ticker),
        },
      }),
    onSuccess: (res, fu) => {
      setTurns((t) => [...t, { question: fu, answer: res.markdown }]);
      if (res.enriched.length) setEnriched(res.enriched);
      setFollowUp("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if ((startMut.isSuccess || followMut.isSuccess) && lastAnswerRef.current) {
      lastAnswerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [turns.length, startMut.isSuccess, followMut.isSuccess]);

  const submitInitial = (q: string) => {
    const t = q.trim();
    if (!t) return toast.error("Type a stock research question");
    setQuery(t);
    startMut.mutate(t);
  };

  const submitFollowUp = (fu: string) => {
    const t = fu.trim();
    if (!t) return toast.error("Type a follow-up question");
    followMut.mutate(t);
  };

  const reset = () => {
    setTurns([]);
    setEnriched([]);
    setOriginalQuery("");
    setQuery("");
    setFollowUp("");
    startMut.reset();
    followMut.reset();
  };

  const hasThread = turns.length > 0;
  const busy = startMut.isPending || followMut.isPending;

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6 bg-[var(--surface)] border-border/60">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--brand-2)] to-[var(--brand)] flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold leading-tight">Stock Researcher</h2>
              <p className="text-xs text-muted-foreground leading-tight">Ask any stock question — then keep asking follow-ups.</p>
            </div>
          </div>
          {hasThread && (
            <Button variant="ghost" size="sm" onClick={reset} className="text-xs h-8">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />New
            </Button>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); submitInitial(query); }}
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
              disabled={busy}
            />
          </div>
          <Button type="submit" disabled={busy} className="h-11 px-5 bg-gradient-to-r from-[var(--brand-2)] to-[var(--brand)] text-white">
            {startMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Researching…</> : "Research"}
          </Button>
        </form>

        {!hasThread && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => submitInitial(ex)}
                disabled={busy}
                className="text-[11px] px-2.5 py-1 rounded-full border border-border/60 bg-background/40 text-muted-foreground hover:text-foreground hover:border-[var(--brand)]/40 transition disabled:opacity-50"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </Card>

      {startMut.isPending && (
        <Card className="p-8 bg-[var(--surface)] border-border/60 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Pulling live quotes and synthesizing research…</span>
        </Card>
      )}

      {hasThread && (
        <>
          {enriched.length > 0 && (
            <div className={`grid gap-3 ${enriched.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
              {enriched.map((q) => <QuoteCard key={q.ticker} q={q} />)}
            </div>
          )}

          {turns.map((turn, i) => (
            <div key={i} ref={i === turns.length - 1 ? lastAnswerRef : undefined}>
              {i > 0 && (
                <div className="flex items-start gap-2 mb-3 px-1">
                  <div className="h-6 w-6 rounded-full bg-[var(--brand)]/15 text-[var(--brand)] flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="h-3 w-3" />
                  </div>
                  <p className="text-sm font-medium text-foreground/90">{turn.question}</p>
                </div>
              )}
              <Card className="p-5 sm:p-7 bg-[var(--surface)] border-border/60">
                {i === 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className="text-[10px]">
                      {isCompare ? "Comparative research" : "Deep dive"}
                    </Badge>
                    {enriched.length > 0 && (
                      <Badge className="text-[10px] bg-[oklch(0.72_0.17_150_/_0.15)] text-[var(--success)] border-[oklch(0.72_0.17_150_/_0.3)]">
                        ● Live data
                      </Badge>
                    )}
                  </div>
                )}
                <MarkdownBlock text={turn.answer} />
              </Card>
            </div>
          ))}

          {followMut.isPending && (
            <Card className="p-6 bg-[var(--surface)] border-border/60 flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Thinking through your follow-up…</span>
            </Card>
          )}

          <Card className="p-4 sm:p-5 bg-[var(--surface)] border-border/60 sticky bottom-3">
            <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
              <CornerDownLeft className="h-3.5 w-3.5" />
              Ask a follow-up about this research
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); submitFollowUp(followUp); }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <Input
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="e.g. What about valuation vs peers? What could go wrong?"
                className="h-10 flex-1"
                maxLength={400}
                disabled={busy}
              />
              <Button type="submit" disabled={busy || !followUp.trim()} className="h-10 px-4 bg-gradient-to-r from-[var(--brand-2)] to-[var(--brand)] text-white">
                {followMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Asking…</> : "Ask"}
              </Button>
            </form>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {FOLLOWUP_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submitFollowUp(s)}
                  disabled={busy}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border/60 bg-background/40 text-muted-foreground hover:text-foreground hover:border-[var(--brand)]/40 transition disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
