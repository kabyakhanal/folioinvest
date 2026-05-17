import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

type Tick = { sym: string; name: string; price: number; chg: number };

const SEED: Tick[] = [
  { sym: "AAPL", name: "Apple", price: 232.41, chg: 0.84 },
  { sym: "MSFT", name: "Microsoft", price: 438.12, chg: -0.32 },
  { sym: "NVDA", name: "NVIDIA", price: 142.78, chg: 2.14 },
  { sym: "GOOGL", name: "Alphabet", price: 178.55, chg: 0.41 },
  { sym: "AMZN", name: "Amazon", price: 214.29, chg: -0.18 },
  { sym: "META", name: "Meta", price: 612.07, chg: 1.22 },
  { sym: "TSLA", name: "Tesla", price: 358.66, chg: -1.45 },
  { sym: "AMD", name: "AMD", price: 158.91, chg: 0.93 },
  { sym: "JPM", name: "JPM Chase", price: 244.13, chg: 0.27 },
  { sym: "BRK.B", name: "Berkshire", price: 469.88, chg: 0.11 },
  { sym: "SPY", name: "S&P 500", price: 598.42, chg: 0.36 },
  { sym: "QQQ", name: "Nasdaq 100", price: 518.04, chg: 0.52 },
  { sym: "DIA", name: "Dow 30", price: 444.31, chg: -0.08 },
  { sym: "VIX", name: "Volatility", price: 14.21, chg: -3.4 },
  { sym: "BTC", name: "Bitcoin", price: 98412.0, chg: 1.87 },
  { sym: "ETH", name: "Ethereum", price: 3742.5, chg: 2.34 },
  { sym: "GLD", name: "Gold", price: 268.74, chg: 0.22 },
  { sym: "CL", name: "Crude Oil", price: 71.18, chg: -0.61 },
];

export function TickerTape() {
  const [ticks, setTicks] = useState(SEED);

  useEffect(() => {
    const i = setInterval(() => {
      setTicks((prev) =>
        prev.map((t) => {
          const drift = (Math.random() - 0.5) * 0.4;
          const newPrice = +(t.price * (1 + drift / 100)).toFixed(2);
          const newChg = +(t.chg + (Math.random() - 0.5) * 0.15).toFixed(2);
          return { ...t, price: newPrice, chg: newChg };
        }),
      );
    }, 3000);
    return () => clearInterval(i);
  }, []);

  const doubled = [...ticks, ...ticks];

  return (
    <div className="ticker-pause overflow-hidden border-y border-border/40 bg-[var(--surface)]/60 backdrop-blur">
      <div className="ticker-track flex gap-8 whitespace-nowrap py-2.5 px-4">
        {doubled.map((t, i) => {
          const up = t.chg >= 0;
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="font-bold text-foreground">{t.sym}</span>
              <span className="text-muted-foreground">{t.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              <span className={`flex items-center gap-0.5 font-medium ${up ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {up ? "+" : ""}{t.chg.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
