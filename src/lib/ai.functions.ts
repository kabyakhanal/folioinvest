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

// ── Stock auto-fundamentals (used to prefill EPS/revenue/sector) ────────────
export const fetchStockFundamentals = createServerFn({ method: "POST" })
  .inputValidator((input: { ticker: string }) => ({ ticker: String(input.ticker).toUpperCase().slice(0, 10) }))
  .handler(async ({ data }) => {
    const raw = await callAI({
      system: "You are a financial data assistant. Respond ONLY with valid JSON, no prose.",
      user: `For the publicly-traded stock ${data.ticker}, provide your best estimate of trailing-twelve-month financial fundamentals.
Return JSON with this exact shape:
{"eps": number, "revenue_billions": number, "sector": "Technology"|"Healthcare"|"Finance"|"Consumer"|"Energy"|"Industrials"|"Real Estate"|"Utilities"|"Materials"|"Communication", "company_name": string}`,
      json: true,
    });
    return parseJSON<{ eps: number; revenue_billions: number; sector: string; company_name: string }>(raw);
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
    return parseJSON<PortfolioInsight>(raw);
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
    return parseJSON<StockAnalysis>(raw);
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
