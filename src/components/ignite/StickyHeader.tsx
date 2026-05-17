import { useState } from "react";
import { Search, Flame, Crown } from "lucide-react";
import { toast } from "sonner";
import { AuthModal } from "./AuthModal";

export function StickyHeader() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [q, setQ] = useState("");

  const openAuth = (m: "signin" | "signup") => {
    setAuthMode(m);
    setAuthOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-5">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] flex items-center justify-center shadow-lg shadow-[var(--brand)]/40">
              <Flame className="h-5 w-5 text-white flame-icon" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold leading-tight">Ignite</div>
              <div className="text-[10px] text-muted-foreground leading-tight">Invest Analysis</div>
            </div>
          </a>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) toast.success(`Searching "${q.toUpperCase()}"…`);
            }}
            className="flex-1 max-w-xl relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tickers, news, analysis…"
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-[var(--surface)] border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50"
            />
          </form>

          <button
            onClick={() => openAuth("signin")}
            className="hidden sm:block px-3 py-1.5 text-sm font-medium text-foreground/90 hover:text-foreground rounded-lg hover:bg-[var(--surface)] transition"
          >
            Sign In
          </button>
          <button
            onClick={() => {
              toast.success("🔥 Premium trial activated!");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-[var(--brand-2)] to-[var(--brand)] text-white shadow-md shadow-[var(--brand)]/30 hover:opacity-90 transition"
          >
            <Crown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Get Premium</span>
          </button>
        </div>
      </header>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} mode={authMode} setMode={setAuthMode} />
    </>
  );
}
