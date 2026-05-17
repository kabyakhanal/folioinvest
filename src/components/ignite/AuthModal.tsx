import { useState } from "react";
import { X, Flame } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  mode: "signin" | "signup";
  setMode: (m: "signin" | "signup") => void;
};

export function AuthModal({ open, onClose, mode, setMode }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success(mode === "signin" ? `Welcome back, ${email}!` : `Account created for ${email}!`);
    setEmail("");
    setPassword("");
    setName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-border/50 shadow-2xl p-6 relative animate-in zoom-in-95"
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-[var(--surface-2)]">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] flex items-center justify-center">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{mode === "signin" ? "Welcome back" : "Join Ignite"}</h2>
            <p className="text-xs text-muted-foreground">{mode === "signin" ? "Sign in to your account" : "Create your free account"}</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3 mt-5">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full h-10 px-3 rounded-lg bg-background border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full h-10 px-3 rounded-lg bg-background border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full h-10 px-3 rounded-lg bg-background border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50"
            required
          />
          <button
            type="submit"
            className="w-full h-10 rounded-lg font-semibold text-white bg-gradient-to-r from-[var(--brand-2)] to-[var(--brand)] shadow-md shadow-[var(--brand)]/30 hover:opacity-90 transition"
          >
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "signin" ? "New to Ignite? " : "Already have an account? "}
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-[var(--brand)] font-medium hover:underline">
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
