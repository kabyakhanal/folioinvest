import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Briefcase, Newspaper } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { StockAnalyzer } from "@/components/investing/StockAnalyzer";
import { PortfolioTracker } from "@/components/investing/PortfolioTracker";
import { NewsSentimentScanner } from "@/components/investing/NewsSentiment";
import { TickerTape } from "@/components/ignite/TickerTape";
import { StickyHeader } from "@/components/ignite/StickyHeader";
import {
  CategoryNav, WatchlistStrip, HeroFeature, ArticleFeed, DeepDiveCards,
  EarningsCalendar, MarketOverview, SectorHeatmap, TrendingLeaderboard,
  PremiumUpsell, BreakingNews, Footer,
} from "@/components/ignite/Sections";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Ignite Invest Analysis — Fire-Fast Market Intelligence" },
      { name: "description", content: "Live tickers, AI deep dives, breaking news, sector heatmaps, and earnings — all in one ignite-powered investing toolkit." },
    ],
  }),
});

const TOOLS = [
  { id: "analyzer", label: "Stock Analyzer", icon: BarChart3, Component: StockAnalyzer },
  { id: "portfolio", label: "Portfolio", icon: Briefcase, Component: PortfolioTracker },
  { id: "news", label: "News Sentiment", icon: Newspaper, Component: NewsSentimentScanner },
] as const;

function Index() {
  const [cat, setCat] = useState("Latest");
  const [tool, setTool] = useState<(typeof TOOLS)[number]["id"]>("analyzer");
  const ActiveTool = TOOLS.find((t) => t.id === tool)!.Component;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StickyHeader />
      <TickerTape />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <WatchlistStrip />

        <div className="mt-5 mb-5">
          <CategoryNav active={cat} onChange={setCat} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* MAIN COLUMN */}
          <div className="space-y-6 min-w-0">
            <HeroFeature />

            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Deep Dive Analysis</h2>
              <DeepDiveCards />
            </section>

            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">{cat} Articles</h2>
              <ArticleFeed />
            </section>

            <EarningsCalendar />

            {/* AI tools tabs */}
            <section className="pt-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">AI Investing Tools</h2>
              <div className="mb-4 flex gap-1 p-1 bg-[var(--surface)] border border-border/40 rounded-xl w-fit overflow-x-auto">
                {TOOLS.map((t) => {
                  const Icon = t.icon;
                  const active = tool === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTool(t.id)}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        active
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
              <div key={tool} className="animate-in fade-in duration-300">
                <ActiveTool />
              </div>
            </section>
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <MarketOverview />
            <SectorHeatmap />
            <TrendingLeaderboard />
            <PremiumUpsell />
            <BreakingNews />
          </aside>
        </div>
      </main>

      <Footer />
      <Toaster position="top-right" />
    </div>
  );
}
