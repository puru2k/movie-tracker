import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { supabaseEnabled } from "../lib/supabase";
import { MOVIE_QUOTES } from "../lib/quotes";
import { FilmIcon } from "./Icons";

const quote = MOVIE_QUOTES[Math.floor(Math.random() * MOVIE_QUOTES.length)];

export function AuthGate() {
  const signIn = useAppStore((s) => s.signIn);
  const signUp = useAppStore((s) => s.signUp);
  const continueAsGuest = useAppStore((s) => s.continueAsGuest);
  const authError = useAppStore((s) => s.authError);
  const authBusy = useAppStore((s) => s.authBusy);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (mode === "signin") void signIn(email.trim(), password);
    else void signUp(email.trim(), password);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-ink-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-gradient-to-b from-brand to-brand-strong text-white shadow-lg">
            <FilmIcon width={26} height={26} />
          </span>
          <div>
            <h1 className="text-[18px] font-semibold tracking-[-0.01em] text-white">
              Movie Tracker
            </h1>
            <p className="text-[12px] text-ink-600">
              {mode === "signin" ? "Sign in to your library" : "Create your account"}
            </p>
          </div>
        </div>

        {!supabaseEnabled ? (
          <div className="rounded-xl bg-amber-400/10 p-4 text-center text-[12px] leading-relaxed text-amber-300/90 ring-1 ring-amber-400/20">
            The cloud backend isn't configured. Set <code>VITE_SUPABASE_URL</code> and{" "}
            <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> to enable accounts.
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="rounded-2xl bg-ink-850 p-5 ring-1 ring-white/10"
          >
            <label className="mb-1.5 block text-[12px] font-medium text-white/80">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mb-3 w-full rounded-lg bg-ink-950 px-3 py-2 text-[13px] text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-brand placeholder:text-ink-600"
            />

            <label className="mb-1.5 block text-[12px] font-medium text-white/80">Password</label>
            <input
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg bg-ink-950 px-3 py-2 text-[13px] text-white outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-brand placeholder:text-ink-600"
            />

            {authError && (
              <p className="mt-3 text-[12px] text-red-400">{authError}</p>
            )}

            <button
              type="submit"
              disabled={authBusy}
              className="mt-4 w-full rounded-lg bg-brand py-2 text-[13px] font-semibold text-white transition hover:bg-brand-strong disabled:opacity-60"
            >
              {authBusy
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-3 w-full text-center text-[12px] text-ink-600 transition hover:text-white"
            >
              {mode === "signin"
                ? "New here? Create an account"
                : "Already have an account? Sign in"}
            </button>
          </form>
        )}

        <div className="mt-4 flex items-center gap-3 text-ink-600">
          <div className="h-px flex-1 bg-white/[0.08]" />
          <span className="text-[11px] uppercase tracking-wider">or</span>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>

        <button
          type="button"
          onClick={() => void continueAsGuest()}
          className="mt-4 w-full rounded-lg bg-white/[0.06] py-2 text-[13px] font-medium text-white/90 transition hover:bg-white/[0.1]"
        >
          Continue as guest
        </button>
        <p className="mt-2 text-center text-[11px] text-ink-600">
          No account needed — your library is saved on this device. Sign in anytime to sync it.
        </p>

        <figure className="mt-6 text-center">
          <blockquote className="font-serif text-[12px] italic leading-snug text-white/45">
            "{quote.quote}"
          </blockquote>
          <figcaption className="mt-1 text-[11px] text-ink-600">
            {quote.movie} · {quote.year}
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
