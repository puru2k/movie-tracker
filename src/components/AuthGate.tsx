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
  const resetPassword = useAppStore((s) => s.resetPassword);
  const resendConfirmation = useAppStore((s) => s.resendConfirmation);
  const updatePassword = useAppStore((s) => s.updatePassword);
  const authError = useAppStore((s) => s.authError);
  const authNotice = useAppStore((s) => s.authNotice);
  const authBusy = useAppStore((s) => s.authBusy);
  const recovery = useAppStore((s) => s.recovery);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (mode === "signin") void signIn(email.trim(), password);
    else void signUp(email.trim(), password);
  };

  const submitNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return;
    void updatePassword(newPassword);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-ink-950 p-4 h-[100dvh]">
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
              {recovery
                ? "Choose a new password"
                : mode === "signin"
                  ? "Sign in to your library"
                  : "Create your account"}
            </p>
          </div>
        </div>

        {!supabaseEnabled ? (
          <div className="rounded-xl bg-amber-400/10 p-4 text-center text-[12px] leading-relaxed text-amber-300/90 ring-1 ring-amber-400/20">
            The cloud backend isn't configured. Set <code>VITE_SUPABASE_URL</code> and{" "}
            <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> to enable accounts.
          </div>
        ) : recovery ? (
          <form onSubmit={submitNewPassword} className="card p-5">
            <label className="mb-1.5 block text-[12px] font-medium text-white/80">
              New password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="field"
            />
            {authError && <p className="mt-3 text-[12px] text-red-400">{authError}</p>}
            <button
              type="submit"
              disabled={authBusy || newPassword.length < 6}
              className="btn btn-primary btn-lg mt-4 w-full"
            >
              {authBusy ? "Saving…" : "Update password"}
            </button>
          </form>
        ) : (
          <form onSubmit={submit} className="card p-5">
            <label className="mb-1.5 block text-[12px] font-medium text-white/80">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="field mb-3"
            />

            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-[12px] font-medium text-white/80">Password</label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => void resetPassword(email)}
                  className="text-[11px] text-ink-600 transition hover:text-brand"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="field"
            />

            {authError && <p className="mt-3 text-[12px] text-red-400">{authError}</p>}
            {authNotice && <p className="mt-3 text-[12px] text-emerald-400">{authNotice}</p>}

            <button type="submit" disabled={authBusy} className="btn btn-primary btn-lg mt-4 w-full">
              {authBusy
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>

            <div className="mt-3 flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-[12px] text-ink-600 transition hover:text-white"
              >
                {mode === "signin"
                  ? "New here? Create an account"
                  : "Already have an account? Sign in"}
              </button>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => void resendConfirmation(email)}
                  className="text-[11px] text-ink-600 transition hover:text-white"
                >
                  Didn't get the confirmation email? Resend it
                </button>
              )}
            </div>
          </form>
        )}

        {!recovery && (
          <>
            <div className="mt-4 flex items-center gap-3 text-ink-600">
              <div className="h-px flex-1 bg-white/[0.08]" />
              <span className="text-[11px] uppercase tracking-wider">or</span>
              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>

            <button
              type="button"
              onClick={() => void continueAsGuest()}
              className="btn btn-secondary btn-lg mt-4 w-full"
            >
              Continue as guest
            </button>
            <p className="mt-2 text-center text-[11px] text-ink-600">
              No account needed — your library is saved on this device. Sign in anytime to sync it.
            </p>
          </>
        )}

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
