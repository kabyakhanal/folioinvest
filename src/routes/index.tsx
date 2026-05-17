import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Briefcase, Newspaper, Sparkles } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { StockAnalyzer } from "@/components/investing/StockAnalyzer";
import { PortfolioTracker } from "@/components/investing/PortfolioTracker";
import { NewsSentimentScanner } from "@/components/investing/NewsSentiment";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Folio — AI Investing Toolkit" },
      { name: "description", content: "Professional AI-powered tools for retail investors: deep stock analysis, portfolio insights, and live market sentiment." },
    ],
  }),
});

const TABS = [
  { id: "analyzer", label: "Stock Analyzer", icon: BarChart3, Component: StockAnalyzer },
  { id: "portfolio", label: "Portfolio", icon: Briefcase, Component: PortfolioTracker },
  { id: "news", label: "News Sentiment", icon: Newspaper, Component: NewsSentimentScanner },
] as const;

function Index() {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("analyzer");
  const ActiveComponent = TABS.find((t) => t.id === active)!.Component;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 h-[400px] w-[600px] rounded-full bg-[var(--brand)]/10 blur-[120px]" />
        <div className="absolute top-40 right-1/4 h-[300px] w-[500px] rounded-full bg-[var(--brand-2)]/10 blur-[120px]" />
      </div>

      <header className="border-b border-border/40 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-5 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] flex items-center justify-center shadow-lg shadow-[var(--brand)]/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Folio</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">AI investing toolkit</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground hidden sm:block">Educational use only · Not financial advice</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8">
        <div className="mb-6 flex gap-1 p-1 bg-[var(--surface)] border border-border/40 rounded-xl w-fit">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-[var(--brand-2)] to-[var(--brand)] text-white shadow-md shadow-[var(--brand)]/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div key={active} className="animate-in fade-in duration-300">
          <ActiveComponent />
        </div>

        <p className="mt-12 text-center text-[11px] text-muted-foreground">
          AI-generated analysis may contain inaccuracies. Always verify with primary sources before investing.
        </p>
      </main>

      <Toaster />
    </div>
  );
}
