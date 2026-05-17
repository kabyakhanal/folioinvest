import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Line, LineChart } from "recharts";
import {
  Flame, TrendingUp, TrendingDown, MessageCircle, Eye, Clock,
  Crown, Radio, ArrowUpRight, Star, Plus, Calendar, Zap,
} from "lucide-react";
import { toast } from "sonner";

// ---- helpers ----------------------------------------------------------------
function spark(seed: number, len = 24, trendUp = true) {
  const out: { i: number; v: number }[] = [];
  let v = 50;
  for (let i = 0; i < len; i++) {
    v += (Math.sin(seed + i * 0.7) + (trendUp ? 0.4 : -0.4) + (Math.random() - 0.5) * 2);
    out.push({ i, v: +v.toFixed(2) });
  }
  return out;
}

// ---- Category tabs ----------------------------------------------------------
const CATS = ["Latest", "Top Analysis", "Trending", "Bullish", "Bearish", "Earnings", "Crypto", "Macro"] as const;
export function CategoryNav({ active, onChange }: { active: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
      {CATS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
            active === c
              ? "bg-gradient-to-r from-[var(--brand-2)] to-[var(--brand)] text-white shadow-md shadow-[var(--brand)]/30"
              : "bg-[var(--surface)] text-muted-foreground hover:text-foreground border border-border/40"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

// ---- Watchlist strip --------------------------------------------------------
const WATCH = [
  { sym: "NVDA", price: 142.78, chg: 2.14 },
  { sym: "AAPL", price: 232.41, chg: 0.84 },
  { sym: "TSLA", price: 358.66, chg: -1.45 },
  { sym: "META", price: 612.07, chg: 1.22 },
  { sym: "AMD", price: 158.91, chg: 0.93 },
  { sym: "BTC", price: 98412, chg: 1.87 },
];
export function WatchlistStrip() {
  return (
    <div className="rounded-xl border border-border/40 bg-[var(--surface)]/70 backdrop-blur p-2.5 flex items-center gap-2 overflow-x-auto">
      <div className="flex items-center gap-1.5 px-2 shrink-0">
        <Star className="h-3.5 w-3.5 text-[var(--warning)]" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Watchlist</span>
      </div>
      {WATCH.map((w) => {
        const up = w.chg >= 0;
        return (
          <button
            key={w.sym}
            onClick={() => toast(`Opening ${w.sym} analysis…`)}
            className="shrink-0 flex items-center gap-2 px-2.5 py-1 rounded-lg hover:bg-[var(--surface-2)] transition"
          >
            <span className="text-xs font-bold">{w.sym}</span>
            <span className="text-xs text-muted-foreground">{w.price.toLocaleString()}</span>
            <span className={`text-[10px] font-semibold ${up ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
              {up ? "+" : ""}{w.chg.toFixed(2)}%
            </span>
          </button>
        );
      })}
      <button onClick={() => toast.success("Add to watchlist")} className="shrink-0 ml-auto p-1.5 rounded-lg hover:bg-[var(--surface-2)]">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ---- Hero featured article --------------------------------------------------
export function HeroFeature() {
  const data = useMemo(() => spark(11, 60, true), []);
  return (
    <article
      onClick={() => toast("Opening featured analysis…")}
      className="cursor-pointer group relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[var(--brand)]/10 shadow-xl"
    >
      <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="heroGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.19 65)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="oklch(0.68 0.22 25)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area dataKey="v" stroke="oklch(0.78 0.19 65)" strokeWidth={2} fill="url(#heroGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="relative p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 rounded-full bg-[var(--brand)]/20 text-[var(--brand)] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Flame className="h-3 w-3" /> Featured
          </span>
          <span className="text-[10px] text-muted-foreground">Deep Dive · 12 min read</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold leading-tight mb-3 max-w-2xl">
          The AI Capex Supercycle: Why NVIDIA's Q4 Could Reignite the Entire Semi Sector
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl mb-5">
          We break down hyperscaler spending, supply constraints, and the three catalysts that could push the AI infrastructure trade into a parabolic phase.
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] flex items-center justify-center text-white text-[10px] font-bold">SK</div>
            <span className="font-medium text-foreground">Sarah Kim</span>
          </div>
          <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> 24.1k</span>
          <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> 312</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 2h ago</span>
        </div>
      </div>
    </article>
  );
}

// ---- Article feed -----------------------------------------------------------
const ARTICLES = [
  { tag: "Bullish", title: "Apple's Services Margin Story Is Just Getting Started", author: "MJ", reads: 8420, comments: 142, sym: "AAPL", up: true },
  { tag: "Earnings", title: "Microsoft Azure Growth Re-Accelerates — Is the Cloud War Over?", author: "DR", reads: 6311, comments: 98, sym: "MSFT", up: true },
  { tag: "Bearish", title: "Tesla's Margin Compression: The Hidden Cost of Price Cuts", author: "LH", reads: 11203, comments: 421, sym: "TSLA", up: false },
  { tag: "Crypto", title: "Bitcoin's Path to $120k: Three On-Chain Signals to Watch", author: "AV", reads: 15622, comments: 287, sym: "BTC", up: true },
  { tag: "Macro", title: "The Fed's Pivot Playbook for 2026 — Sector Winners and Losers", author: "TN", reads: 4810, comments: 76, sym: "SPY", up: true },
  { tag: "Trending", title: "AMD's MI400 Roadmap Could Steal Real Share From NVIDIA", author: "EC", reads: 9134, comments: 211, sym: "AMD", up: true },
];
export function ArticleFeed() {
  return (
    <div className="space-y-3">
      {ARTICLES.map((a, i) => {
        const data = spark(i + 3, 20, a.up);
        return (
          <article
            key={i}
            onClick={() => toast(`Opening "${a.title.slice(0, 30)}…"`)}
            className="cursor-pointer p-4 rounded-xl bg-[var(--surface)]/70 border border-border/40 hover:border-[var(--brand)]/40 hover:bg-[var(--surface)] transition group"
          >
            <div className="flex gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    a.tag === "Bullish" ? "bg-[var(--success)]/20 text-[var(--success)]"
                    : a.tag === "Bearish" ? "bg-[var(--danger)]/20 text-[var(--danger)]"
                    : "bg-[var(--brand)]/20 text-[var(--brand)]"
                  }`}>{a.tag}</span>
                  <span className="text-[10px] text-muted-foreground">${a.sym}</span>
                </div>
                <h3 className="text-base font-semibold leading-snug group-hover:text-[var(--brand)] transition">{a.title}</h3>
                <div className="mt-2.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] flex items-center justify-center text-white text-[9px] font-bold">{a.author}</div>
                  </div>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{a.reads.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{a.comments}</span>
                </div>
              </div>
              <div className="w-24 h-14 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <Line type="monotone" dataKey="v" stroke={a.up ? "oklch(0.76 0.16 150)" : "oklch(0.65 0.23 18)"} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

// ---- Deep Dive cards --------------------------------------------------------
const DEEP = [
  { sym: "NVDA", price: 142.78, chg: 2.14, rating: "Strong Buy", desc: "AI infra demand still outpacing supply through 2026." },
  { sym: "MSFT", price: 438.12, chg: -0.32, rating: "Buy", desc: "Azure re-acceleration + Copilot monetization inflection." },
  { sym: "TSLA", price: 358.66, chg: -1.45, rating: "Hold", desc: "Robotaxi optionality balanced by auto margin pressure." },
];
export function DeepDiveCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {DEEP.map((d) => {
        const up = d.chg >= 0;
        const ratingColor =
          d.rating === "Strong Buy" ? "bg-[var(--success)]/20 text-[var(--success)]"
          : d.rating === "Buy" ? "bg-[var(--brand)]/20 text-[var(--brand)]"
          : d.rating === "Hold" ? "bg-[var(--warning)]/20 text-[var(--warning)]"
          : "bg-[var(--danger)]/20 text-[var(--danger)]";
        return (
          <button
            key={d.sym}
            onClick={() => toast(`Opening ${d.sym} deep dive`)}
            className="text-left p-4 rounded-xl bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] border border-border/40 hover:border-[var(--brand)]/50 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold">{d.sym}</span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-xl font-semibold">${d.price.toLocaleString()}</span>
              <span className={`text-xs font-medium ${up ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                {up ? "+" : ""}{d.chg.toFixed(2)}%
              </span>
            </div>
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ratingColor}`}>{d.rating}</span>
            <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">{d.desc}</p>
          </button>
        );
      })}
    </div>
  );
}

// ---- Upcoming Earnings ------------------------------------------------------
const EARN = [
  { sym: "NVDA", date: "Feb 25", eps: "$0.84", outlook: "Beat" },
  { sym: "CRM", date: "Feb 26", eps: "$2.61", outlook: "Beat" },
  { sym: "SNOW", date: "Feb 27", eps: "$0.18", outlook: "Mixed" },
  { sym: "DELL", date: "Feb 28", eps: "$2.04", outlook: "Miss" },
  { sym: "ZM", date: "Mar 3", eps: "$1.32", outlook: "Beat" },
];
export function EarningsCalendar() {
  return (
    <div className="rounded-xl bg-[var(--surface)]/70 border border-border/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-[var(--brand)]" />
        <h3 className="text-sm font-bold">Upcoming Earnings</h3>
      </div>
      <table className="w-full text-sm">
        <thead className="text-[10px] uppercase text-muted-foreground bg-[var(--surface-2)]/40">
          <tr><th className="text-left px-4 py-2">Ticker</th><th className="text-left">Date</th><th className="text-left">Est. EPS</th><th className="text-right px-4">Outlook</th></tr>
        </thead>
        <tbody>
          {EARN.map((e) => {
            const color =
              e.outlook === "Beat" ? "bg-[var(--success)]/20 text-[var(--success)]"
              : e.outlook === "Miss" ? "bg-[var(--danger)]/20 text-[var(--danger)]"
              : "bg-[var(--warning)]/20 text-[var(--warning)]";
            return (
              <tr key={e.sym} className="border-t border-border/30 hover:bg-[var(--surface-2)]/30 cursor-pointer" onClick={() => toast(`${e.sym} earnings on ${e.date}`)}>
                <td className="px-4 py-2.5 font-bold">{e.sym}</td>
                <td className="text-muted-foreground">{e.date}</td>
                <td className="text-muted-foreground">{e.eps}</td>
                <td className="text-right px-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${color}`}>{e.outlook}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---- Sidebar: Market Overview with animated bars ----------------------------
const MKT = [
  { sym: "S&P 500", price: 598.42, chg: 0.36 },
  { sym: "NASDAQ", price: 518.04, chg: 0.52 },
  { sym: "DOW", price: 444.31, chg: -0.08 },
  { sym: "BTC", price: 98412, chg: 1.87 },
  { sym: "ETH", price: 3742, chg: 2.34 },
  { sym: "GOLD", price: 268.74, chg: 0.22 },
];
export function MarketOverview() {
  const [data, setData] = useState(MKT);
  useEffect(() => {
    const i = setInterval(() => {
      setData((prev) => prev.map((d) => ({ ...d, chg: +(d.chg + (Math.random() - 0.5) * 0.2).toFixed(2), price: +(d.price * (1 + (Math.random() - 0.5) / 500)).toFixed(2) })));
    }, 3000);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="rounded-xl bg-[var(--surface)]/70 border border-border/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-2"><Radio className="h-3.5 w-3.5 text-[var(--success)] animate-pulse" /> Live Market</h3>
        <span className="text-[10px] text-muted-foreground">updating</span>
      </div>
      <div className="space-y-2.5">
        {data.map((m) => {
          const up = m.chg >= 0;
          const w = Math.min(100, Math.abs(m.chg) * 30 + 15);
          return (
            <div key={m.sym}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold">{m.sym}</span>
                <span className="text-muted-foreground">{m.price.toLocaleString()}</span>
                <span className={`font-bold ${up ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>{up ? "+" : ""}{m.chg.toFixed(2)}%</span>
              </div>
              <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div
                  key={`${m.sym}-${m.chg}`}
                  className="price-bar-fill h-full rounded-full"
                  style={{
                    ["--bar-w" as any]: `${w}%`,
                    background: up ? "oklch(0.76 0.16 150)" : "oklch(0.65 0.23 18)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Sector heatmap ---------------------------------------------------------
const SECTORS = [
  { name: "Tech", chg: 1.84 }, { name: "Energy", chg: -0.62 },
  { name: "Health", chg: 0.41 }, { name: "Financials", chg: 0.78 },
  { name: "Consumer", chg: -0.21 }, { name: "Utilities", chg: 0.12 },
  { name: "Industrials", chg: 0.55 }, { name: "Materials", chg: -1.13 },
  { name: "Real Estate", chg: 0.34 },
];
export function SectorHeatmap() {
  return (
    <div className="rounded-xl bg-[var(--surface)]/70 border border-border/40 p-4">
      <h3 className="text-sm font-bold mb-3">Sector Performance</h3>
      <div className="grid grid-cols-3 gap-1.5">
        {SECTORS.map((s) => {
          const up = s.chg >= 0;
          const intensity = Math.min(1, Math.abs(s.chg) / 2);
          const bg = up
            ? `oklch(0.76 ${0.06 + intensity * 0.1} 150 / ${0.3 + intensity * 0.5})`
            : `oklch(0.65 ${0.1 + intensity * 0.15} 18 / ${0.3 + intensity * 0.5})`;
          return (
            <div key={s.name} className="rounded-lg p-2 text-center" style={{ background: bg }}>
              <div className="text-[10px] font-semibold">{s.name}</div>
              <div className="text-[11px] font-bold">{up ? "+" : ""}{s.chg.toFixed(2)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Trending leaderboard ---------------------------------------------------
const TREND = [
  { sym: "NVDA", mentions: 12482, chg: 2.14 },
  { sym: "TSLA", mentions: 9821, chg: -1.45 },
  { sym: "BTC", mentions: 8430, chg: 1.87 },
  { sym: "AAPL", mentions: 7211, chg: 0.84 },
  { sym: "META", mentions: 6102, chg: 1.22 },
];
export function TrendingLeaderboard() {
  return (
    <div className="rounded-xl bg-[var(--surface)]/70 border border-border/40 p-4">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Flame className="h-3.5 w-3.5 text-[var(--brand)]" /> Trending Now</h3>
      <ol className="space-y-1.5">
        {TREND.map((t, i) => {
          const up = t.chg >= 0;
          return (
            <li key={t.sym} className="flex items-center gap-2 text-xs p-1.5 rounded-lg hover:bg-[var(--surface-2)]/50 cursor-pointer" onClick={() => toast(`${t.sym} trending`)}>
              <span className="w-4 text-muted-foreground font-bold">{i + 1}</span>
              <span className="font-bold flex-1">{t.sym}</span>
              <span className="text-muted-foreground">{(t.mentions / 1000).toFixed(1)}k</span>
              <span className={`font-semibold ${up ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>{up ? "+" : ""}{t.chg.toFixed(2)}%</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---- Premium upsell --------------------------------------------------------
export function PremiumUpsell() {
  return (
    <div className="rounded-xl p-5 bg-gradient-to-br from-[var(--brand-2)] to-[var(--brand)] text-white shadow-xl shadow-[var(--brand)]/30">
      <Crown className="h-6 w-6 mb-2" />
      <h3 className="text-base font-bold mb-1">Ignite Premium</h3>
      <p className="text-xs text-white/80 mb-3">Real-time alerts, unlimited AI deep dives, and exclusive analyst calls.</p>
      <ul className="text-xs space-y-1 mb-4">
        <li className="flex gap-1.5"><Zap className="h-3.5 w-3.5" /> Live institutional flow</li>
        <li className="flex gap-1.5"><Zap className="h-3.5 w-3.5" /> Unlimited AI reports</li>
        <li className="flex gap-1.5"><Zap className="h-3.5 w-3.5" /> Priority earnings access</li>
      </ul>
      <button
        onClick={() => toast.success("🔥 Premium trial activated!")}
        className="w-full py-2 rounded-lg bg-white text-[var(--brand-2)] font-bold text-sm hover:bg-white/90 transition"
      >
        Start 7-day free trial
      </button>
    </div>
  );
}

// ---- Breaking news feed -----------------------------------------------------
const NEWS_SEED = [
  { t: "NVIDIA announces next-gen Rubin GPU roadmap", time: "Just now" },
  { t: "Fed minutes signal patient stance on rate cuts", time: "3m" },
  { t: "Apple to expand India manufacturing capacity", time: "8m" },
  { t: "Bitcoin breaks $98k as ETF inflows accelerate", time: "14m" },
  { t: "Tesla cuts Model Y prices in EU markets", time: "22m" },
];
export function BreakingNews() {
  const [items, setItems] = useState(NEWS_SEED);
  useEffect(() => {
    const headlines = [
      "Oil rallies on OPEC+ surprise cut",
      "Microsoft signs $10B AI infra deal",
      "Amazon Web Services posts record quarter",
      "Meta beats on ad revenue, stock pops 4%",
    ];
    const i = setInterval(() => {
      setItems((p) => [{ t: headlines[Math.floor(Math.random() * headlines.length)], time: "Just now" }, ...p.slice(0, 5)]);
    }, 12000);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="rounded-xl bg-[var(--surface)]/70 border border-border/40 p-4">
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[var(--danger)] animate-pulse" /> Breaking
      </h3>
      <ul className="space-y-2.5">
        {items.map((n, i) => (
          <li key={i} className="text-xs leading-snug">
            <p className="text-foreground">{n.t}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- Footer ----------------------------------------------------------------
export function Footer() {
  const cols = [
    { h: "Product", l: ["Stock Analyzer", "Portfolio", "News Sentiment", "Premium"] },
    { h: "Company", l: ["About", "Careers", "Press", "Contact"] },
    { h: "Resources", l: ["Help Center", "API Docs", "Glossary", "Blog"] },
    { h: "Legal", l: ["Privacy", "Terms", "Disclaimer", "Risk"] },
  ];
  return (
    <footer className="mt-16 border-t border-border/40 bg-[var(--surface)]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-8 mb-8">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] flex items-center justify-center">
                <Flame className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">Ignite</span>
            </div>
            <p className="text-xs text-muted-foreground">Fire-fast market intelligence for retail investors.</p>
            <div className="flex gap-2 mt-3">
              {["X", "in", "YT", "TG"].map((s) => (
                <button key={s} onClick={() => toast(`Opening ${s}`)} className="h-7 w-7 rounded-md bg-[var(--surface-2)] hover:bg-[var(--brand)]/20 text-[10px] font-bold">{s}</button>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.h}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{c.h}</h4>
              <ul className="space-y-1.5">
                {c.l.map((l) => (
                  <li key={l}>
                    <button onClick={() => toast(l)} className="text-xs text-foreground/80 hover:text-[var(--brand)]">{l}</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-6 border-t border-border/40 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <p className="text-[11px] text-muted-foreground">© 2026 Ignite Invest Analysis. All rights reserved.</p>
          <p className="text-[11px] text-muted-foreground">⚠️ Educational only. Not financial advice. Always do your own research.</p>
        </div>
      </div>
    </footer>
  );
}
