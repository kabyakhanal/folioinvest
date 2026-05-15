import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Search, TrendingUp, TrendingDown, Minus, Shuffle, Eye, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { newsSentiment, type NewsSentimentResult } from "@/lib/ai.functions";
import { toast } from "sonner";

const SENTIMENT_META: Record<string, { color: string; bg: string; border: string; Icon: typeof TrendingUp }> = {
  Bullish: { color: "text-[var(--success)]", bg: "bg-[oklch(0.72_0.17_150_/_0.1)]", border: "border-[oklch(0.72_0.17_150_/_0.3)]", Icon: TrendingUp },
  Bearish: { color: "text-[var(--danger)]", bg: "bg-[oklch(0.68_0.21_25_/_0.1)]", border: "border-[oklch(0.68_0.21_25_/_0.3)]", Icon: TrendingDown },
  Mixed: { color: "text-[var(--warning)]", bg: "bg-[oklch(0.78_0.16_75_/_0.1)]", border: "border-[oklch(0.78_0.16_75_/_0.3)]", Icon: Shuffle },
  Neutral: { color: "text-muted-foreground", bg: "bg-muted/30", border: "border-border", Icon: Minus },
};

const SUGGESTIONS = ["NVIDIA", "Apple", "Tesla", "Banking sector", "AI chips", "Renewable energy"];

export function NewsSentimentScanner() {
  const [topic, setTopic] = useState("");
  const fn = useServerFn(newsSentiment);

  const mutation = useMutation({
    mutationFn: (t: string) => fn({ data: { topic: t } }),
    onError: (e: Error) => toast.error(e.message),
  });

  const scan = (t?: string) => {
    const q = (t ?? topic).trim();
    if (!q) {
      toast.error("Enter a topic to scan");
      return;
    }
    if (t) setTopic(t);
    mutation.mutate(q);
  };

  const result = mutation.data as NewsSentimentResult | undefined;
  const meta = result ? SENTIMENT_META[result.sentiment] ?? SENTIMENT_META.Neutral : null;

  return (
    <div className="space-y-5">
      <Card className="p-5 bg-[var(--surface)] border-border/40">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 bg-background/50"
              placeholder="Stock, company or sector…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && scan()}
            />
          </div>
          <Button onClick={() => scan()} disabled={mutation.isPending || !topic.trim()} variant="brand">
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Scan"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => scan(s)} className="text-xs px-2.5 py-1 rounded-full bg-background/50 border border-border/40 hover:border-[var(--brand)]/50 hover:text-foreground text-muted-foreground transition">
              {s}
            </button>
          ))}
        </div>
      </Card>

      {result && meta && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className={`p-5 ${meta.bg} ${meta.border}`}>
            <div className="flex items-start gap-4">
              <div className={`h-12 w-12 rounded-full bg-background/40 flex items-center justify-center ${meta.color}`}>
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
