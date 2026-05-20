import { createServerFn } from "@tanstack/react-start";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

async function callAI(opts: {
  system: string;
  user: string;
  json?: boolean;
  model?: string;
}) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const body: Record<string, unknown> = {
    model: opts.model ?? DEFAULT_MODEL,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
  };
  if (opts.json) body.response_format = { type: "json_object" };

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add funds in Settings → Workspace → Usage.");
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.choices?.[0]?.message?.content as string) ?? "";
}

function parseJSON<T>(raw: string): T {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : cleaned) as T;
}

export type StockAnalysis = {
  verdict: string;
  score: number;
  confidence: string;
  fair_value_estimate: number;
  summary: string;
  thesis: string;
  bear_case: string;
  key_metrics: Array<{ label: string; value: string; note: string }>;
  watch_for: Array<{ signal: string; why: string }>;
  watch_out_for: Array<{ risk: string; why: string }>;
  competitive_moat: string;
  lesson: string;
};

export type PortfolioInsight = {
  diversification_score: number;
  concentration_risk: string;
  sector_skew: string;
  strengths: string[];
  weaknesses: string[];
  actions: Array<{ action: string; rationale: string }>;
  summary: string;
};

export type NewsSentimentResult = {
  sentiment: string;
  score: number;
  headline: string;
  narrative: string;
  positives: Array<{ point: string; impact: string }>;
  negatives: Array<{ point: string; impact: string }>;
  what_it_means: string;
  watch_for: string[];
  glossary: { term: string; definition: string };
};

// ── Stock price (Yahoo Finance, server-side avoids CORS) ────────────────────
export const fetchStockQuote = createServerFn({ method: "POST" })
  .inputValidator((input: { ticker: string }) => {
    if (!input?.ticker || typeof input.ticker !== "string") throw new Error("Invalid ticker");
    return { ticker: input.ticker.toUpperCase().slice(0, 10) };
  })
  .handler(async ({ data }) => {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(data.ticker)}`,
        { headers: { "User-Agent": "Mozilla/5.0" } },
      );
      if (!res.ok) return { price: null, name: null, currency: null };
      const j = await res.json();
      const meta = j?.chart?.result?.[0]?.meta;
      return {
        price: meta?.regularMarketPrice ?? null,
        name: meta?.longName ?? meta?.shortName ?? null,
        currency: meta?.currency ?? "USD",
      };
    } catch {
      return { price: null, name: null, currency: null };
    }
  });

// ── Stock historical prices (Yahoo Finance) ─────────────────────────────────
export const fetchStockHistory = createServerFn({ method: "POST" })
  .inputValidator((input: { ticker: string; range?: string }) => ({
    ticker: String(input.ticker).toUpperCase().slice(0, 10),
    range: ["1mo", "3mo", "6mo", "1y", "5y", "max"].includes(input.range ?? "")
      ? (input.range as string)
      : "1y",
  }))
  .handler(async ({ data }) => {
    try {
      const interval =
        data.range === "1mo" ? "1d" :
        data.range === "3mo" ? "1d" :
        data.range === "6mo" ? "1d" :
        data.range === "1y"  ? "1d" :
        data.range === "5y"  ? "1wk" : "1mo";
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(data.ticker)}?range=${data.range}&interval=${interval}`,
        { headers: { "User-Agent": "Mozilla/5.0" } },
      );
      if (!res.ok) return { points: [] as Array<{ t: number; price: number }>, currency: "USD" };
      const j = await res.json();
      const r = j?.chart?.result?.[0];
      const ts: number[] = r?.timestamp ?? [];
      const closes: Array<number | null> = r?.indicators?.quote?.[0]?.close ?? [];
      const points = ts
        .map((t, i) => ({ t: t * 1000, price: closes[i] as number }))
        .filter((p) => typeof p.price === "number" && !isNaN(p.price));
      return { points, currency: r?.meta?.currency ?? "USD" };
    } catch {
      return { points: [] as Array<{ t: number; price: number }>, currency: "USD" };
    }
  });

// ── Map Yahoo sector → our simplified list ──────────────────────────────────
const SECTOR_MAP: Record<string, string> = {
  "Technology": "Technology",
  "Healthcare": "Healthcare",
  "Financial Services": "Finance",
  "Financial": "Finance",
  "Consumer Cyclical": "Consumer",
  "Consumer Defensive": "Consumer",
  "Consumer Staples": "Consumer",
  "Consumer Discretionary": "Consumer",
  "Energy": "Energy",
  "Industrials": "Industrials",
  "Real Estate": "Real Estate",
  "Utilities": "Utilities",
  "Basic Materials": "Materials",
  "Materials": "Materials",
  "Communication Services": "Communication",
};

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

async function yahooQuoteSummary(ticker: string) {
  const modules = "summaryProfile,assetProfile,financialData,defaultKeyStatistics,price,summaryDetail,incomeStatementHistory,earnings";
  const hosts = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"];
  for (const host of hosts) {
    try {
      const res = await fetch(
        `https://${host}/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}`,
        { headers: { "User-Agent": UA, "Accept": "application/json" } },
      );
      if (!res.ok) continue;
      const j = await res.json();
      const r = j?.quoteSummary?.result?.[0];
      if (r) return r;
    } catch {
      /* try next */
    }
  }
  return null;
}

// ── Stock auto-fundamentals — REAL data from Yahoo, AI only as last resort ──
export const fetchStockFundamentals = createServerFn({ method: "POST" })
  .inputValidator((input: { ticker: string }) => ({ ticker: String(input.ticker).toUpperCase().slice(0, 10) }))
  .handler(async ({ data }) => {
    const r = await yahooQuoteSummary(data.ticker);
    if (r) {
      const eps =
        r?.defaultKeyStatistics?.trailingEps?.raw ??
        r?.financialData?.trailingEps?.raw ??
        r?.summaryDetail?.trailingEps?.raw ??
        null;
      // Prefer TTM revenue from financialData, fall back to latest annual income statement
      const ttmRevenue = r?.financialData?.totalRevenue?.raw ?? null;
      const annualRevenue = r?.incomeStatementHistory?.incomeStatementHistory?.[0]?.totalRevenue?.raw ?? null;
      const earningsRevenue = r?.earnings?.financialsChart?.yearly?.slice(-1)?.[0]?.revenue?.raw ?? null;
      const revenue = ttmRevenue ?? annualRevenue ?? earningsRevenue ?? null;
      const sectorRaw = r?.assetProfile?.sector ?? r?.summaryProfile?.sector ?? null;
      const name = r?.price?.longName ?? r?.price?.shortName ?? null;
      const sector = sectorRaw ? (SECTOR_MAP[sectorRaw] ?? sectorRaw) : null;
      if (eps != null || revenue != null || sector != null) {
        return {
          eps: eps ?? 0,
          revenue_billions: revenue ? Number((revenue / 1e9).toFixed(2)) : 0,
          sector: sector ?? "Technology",
          company_name: name ?? data.ticker,
          source: "yahoo" as const,
        };
      }
    }
    // Fallback to AI estimate (clearly marked).
    const raw = await callAI({
      system: "You are a financial data assistant. Respond ONLY with valid JSON, no prose.",
      user: `For ${data.ticker}, provide trailing-twelve-month fundamentals as best you know. If you are not confident, return 0.
JSON shape: {"eps": number, "revenue_billions": number, "sector": "Technology"|"Healthcare"|"Finance"|"Consumer"|"Energy"|"Industrials"|"Real Estate"|"Utilities"|"Materials"|"Communication", "company_name": string}`,
      json: true,
    });
    const parsed = parseJSON<{ eps: number; revenue_billions: number; sector: string; company_name: string }>(raw);
    return { ...parsed, source: "ai" as const };
  });

// ── Stock Scanner: live quote stats + AI sentiment on a specific ticker ─────
export type StockScannerResult = {
  ticker: string;
  company_name: string;
  price: number | null;
  change_pct: number | null;
  currency: string;
  day_low: number | null;
  day_high: number | null;
  week52_low: number | null;
  week52_high: number | null;
  volume: number | null;
  market_cap: number | null;
  sentiment: string;
  score: number;
  headline: string;
  narrative: string;
  positives: Array<{ point: string; impact: string }>;
  negatives: Array<{ point: string; impact: string }>;
  what_it_means: string;
  watch_for: string[];
  glossary: { term: string; definition: string };
};

export const scanStock = createServerFn({ method: "POST" })
  .inputValidator((input: { ticker: string }) => {
    const t = String(input?.ticker ?? "").trim().toUpperCase().slice(0, 10);
    if (!t) throw new Error("Ticker required");
    return { ticker: t };
  })
  .handler(async ({ data }) => {
    // 1) Live quote from Yahoo chart meta
    let price: number | null = null, change_pct: number | null = null, currency = "USD";
    let day_low: number | null = null, day_high: number | null = null;
    let week52_low: number | null = null, week52_high: number | null = null;
    let volume: number | null = null, name: string | null = null;
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(data.ticker)}?range=1d&interval=1m`,
        { headers: { "User-Agent": UA } },
      );
      if (res.ok) {
        const j = await res.json();
        const meta = j?.chart?.result?.[0]?.meta;
        if (meta) {
          price = meta.regularMarketPrice ?? null;
          const prev = meta.chartPreviousClose ?? meta.previousClose ?? null;
          change_pct = price && prev ? Number((((price - prev) / prev) * 100).toFixed(2)) : null;
          currency = meta.currency ?? "USD";
          day_low = meta.regularMarketDayLow ?? null;
          day_high = meta.regularMarketDayHigh ?? null;
          week52_low = meta.fiftyTwoWeekLow ?? null;
          week52_high = meta.fiftyTwoWeekHigh ?? null;
          volume = meta.regularMarketVolume ?? null;
          name = meta.longName ?? meta.shortName ?? null;
        }
      }
    } catch { /* ignore */ }

    // 2) Market cap + company name from quoteSummary if available
    let market_cap: number | null = null;
    const r = await yahooQuoteSummary(data.ticker);
    if (r) {
      market_cap = r?.price?.marketCap?.raw ?? null;
      name = name ?? r?.price?.longName ?? r?.price?.shortName ?? null;
    }

    // 3) AI sentiment grounded in the real numbers
    const context = `Ticker: ${data.ticker}${name ? ` (${name})` : ""}
Live price: ${price ?? "unknown"} ${currency}
1-day change: ${change_pct != null ? change_pct + "%" : "unknown"}
52-week range: ${week52_low ?? "?"} – ${week52_high ?? "?"}
Market cap: ${market_cap ? (market_cap / 1e9).toFixed(1) + "B" : "unknown"}`;

    const raw = await callAI({
      system:
        "You are a market sentiment analyst with deep knowledge of recent earnings, guidance, product cycles, and macro themes. Be SPECIFIC to this exact ticker — never generic. Reference the live price context. Respond ONLY with valid JSON.",
      user: `Provide a sentiment snapshot for the stock below using your knowledge of its recent business performance.
${context}

Return JSON:
{
  "sentiment": "Bullish"|"Bearish"|"Mixed"|"Neutral",
  "score": integer -100..100,
  "headline": "A realistic representative headline specific to ${data.ticker} right now",
  "narrative": "2-3 sentences on the dominant market narrative for this stock",
  "positives": [{"point":"specific positive driver","impact":"High|Medium|Low"}, {"point":"...","impact":"..."}, {"point":"...","impact":"..."}],
  "negatives": [{"point":"specific concern","impact":"High|Medium|Low"}, {"point":"...","impact":"..."}, {"point":"...","impact":"..."}],
  "what_it_means": "2 sentences for a retail investor",
  "watch_for": ["upcoming catalyst 1", "upcoming catalyst 2"],
  "glossary": {"term":"relevant investing term","definition":"plain-English definition"}
}`,
      json: true,
    });
    const ai = parseJSON<Omit<StockScannerResult,
      "ticker"|"company_name"|"price"|"change_pct"|"currency"|"day_low"|"day_high"|"week52_low"|"week52_high"|"volume"|"market_cap">>(raw);

    return {
      ticker: data.ticker,
      company_name: name ?? data.ticker,
      price, change_pct, currency,
      day_low, day_high, week52_low, week52_high,
      volume, market_cap,
      ...ai,
    } satisfies StockScannerResult;
  });

// ── Deep stock analysis ─────────────────────────────────────────────────────
export const analyzeStock = createServerFn({ method: "POST" })
  .inputValidator((input: {
    ticker: string;
    price: number;
    eps?: number;
    revenue?: number;
    sector?: string;
  }) => input)
  .handler(async ({ data }) => {
    const pe = data.eps ? (data.price / data.eps).toFixed(2) : "N/A";
    const raw = await callAI({
      system:
        "You are a senior equity analyst writing for an educated retail investor. Be concrete, specific, and balanced. Use real industry knowledge. Respond ONLY with valid JSON.",
      user: `Provide a deep, professional analysis of ${data.ticker.toUpperCase()}.
Inputs:
- Price: $${data.price}
- EPS (TTM): ${data.eps ?? "unknown"}
- P/E: ${pe}
- Revenue (B USD): ${data.revenue ?? "unknown"}
- Sector: ${data.sector ?? "unknown"}

Return JSON:
{
  "verdict": "Undervalued" | "Fairly Valued" | "Overvalued",
  "score": integer 1-10,
  "confidence": "Low" | "Medium" | "High",
  "fair_value_estimate": number,
  "summary": "3-4 sentence executive summary mentioning valuation, growth, and competitive position.",
  "thesis": "Bull thesis in 2-3 sentences — the strongest reason to own this.",
  "bear_case": "Bear thesis in 2-3 sentences — the strongest reason to avoid this.",
  "key_metrics": [{"label": string, "value": string, "note": string}],
  "watch_for": [
    {"signal": "Catalyst or positive signal to watch FOR", "why": "why it matters"},
    {"signal": "...", "why": "..."},
    {"signal": "...", "why": "..."}
  ],
  "watch_out_for": [
    {"risk": "Specific risk to watch OUT for", "why": "why it matters"},
    {"risk": "...", "why": "..."},
    {"risk": "...", "why": "..."}
  ],
  "competitive_moat": "1-2 sentence assessment of competitive advantage.",
  "lesson": "One investing concept this stock illustrates, explained clearly in 1-2 sentences."
}`,
      json: true,
    });
    return parseJSON<StockAnalysis>(raw);
  });

// ── Portfolio insight ───────────────────────────────────────────────────────
export const portfolioInsight = createServerFn({ method: "POST" })
  .inputValidator((input: { holdings: Array<{ ticker: string; shares: number; buyPrice: number; currentPrice: number }> }) => input)
  .handler(async ({ data }) => {
    const summary = data.holdings
      .map((h) => {
        const gain = (((h.currentPrice - h.buyPrice) / h.buyPrice) * 100).toFixed(1);
        const value = (h.shares * h.currentPrice).toFixed(0);
        return `${h.ticker}: ${h.shares} sh @ $${h.buyPrice} → $${h.currentPrice} (${gain}%), value $${value}`;
      })
      .join("\n");
    const totalValue = data.holdings.reduce((s, h) => s + h.shares * h.currentPrice, 0);

    const raw = await callAI({
      system: "You are a professional portfolio strategist for retail investors. Be specific, balanced, and actionable. Respond ONLY with valid JSON.",
      user: `Analyze this portfolio:
${summary}
Total value: $${totalValue.toFixed(0)}

Return JSON:
{
  "diversification_score": integer 1-10,
  "concentration_risk": "Low" | "Medium" | "High",
  "sector_skew": "1 sentence describing sector exposure if known",
  "strengths": ["short bullet", "short bullet", "short bullet"],
  "weaknesses": ["short bullet", "short bullet"],
  "actions": [
    {"action": "Concrete action", "rationale": "Why"},
    {"action": "...", "rationale": "..."},
    {"action": "...", "rationale": "..."}
  ],
  "summary": "2-3 sentence overall assessment."
}`,
      json: true,
    });
    return parseJSON<PortfolioInsight>(raw);
  });

// ── News sentiment ──────────────────────────────────────────────────────────
export const newsSentiment = createServerFn({ method: "POST" })
  .inputValidator((input: { topic: string }) => {
    const t = String(input.topic ?? "").trim().slice(0, 120);
    if (!t) throw new Error("Topic required");
    return { topic: t };
  })
  .handler(async ({ data }) => {
    const raw = await callAI({
      system:
        "You are a market sentiment analyst. Use your knowledge of recent business news, earnings trends, and macro themes. Be specific to the topic — never generic. Respond ONLY with valid JSON.",
      user: `Provide a market sentiment snapshot for: "${data.topic}".

Return JSON:
{
  "sentiment": "Bullish" | "Bearish" | "Mixed" | "Neutral",
  "score": integer -100 to 100,
  "headline": "A realistic representative headline (specific to ${data.topic}).",
  "narrative": "2-3 sentences capturing the dominant market narrative right now.",
  "positives": [
    {"point": "specific positive driver", "impact": "High"|"Medium"|"Low"},
    {"point": "...", "impact": "..."},
    {"point": "...", "impact": "..."}
  ],
  "negatives": [
    {"point": "specific concern", "impact": "High"|"Medium"|"Low"},
    {"point": "...", "impact": "..."},
    {"point": "...", "impact": "..."}
  ],
  "what_it_means": "2 sentences on what this means for a retail investor.",
  "watch_for": ["upcoming catalyst 1", "upcoming catalyst 2"],
  "glossary": {"term": "relevant investing term", "definition": "plain-English definition"}
}`,
      json: true,
    });
    return parseJSON<NewsSentimentResult>(raw);
  });
