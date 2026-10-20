"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import { CrawlspaceLogo } from "./CrawlspaceLogo";
import { AsciiField } from "./AsciiField";
import { refreshSession, useSession } from "./useSession";

const PERKS = [
  "Every audit saved to your history automatically",
  "Score trends per page, per engine",
  "Read-only share links for clients and teammates",
  "Still free. Audits never need an account",
];

/** Where to go after signing in: only same-site paths, never an open redirect. */
function safeNext(raw: string | null): string {
  const fallback = "/dashboard?tab=history";
  // "/\\evil.com" and "//evil.com" both leave the site in browsers; so does any scheme.
  if (!raw || !raw.startsWith("/") || raw[1] === "/" || raw[1] === "\\" || /[\u0000-\u001f]/.test(raw)) return fallback;
  try {
    const u = new URL(raw, window.location.origin);
    return u.origin === window.location.origin ? u.pathname + u.search + u.hash : fallback;
  } catch {
    return fallback;
  }
}

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const params = useSearchParams();
  const session = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(isSignup ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(isSignup ? { name, email, password } : { email, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Something went wrong. Try again.");
      await refreshSession();
      router.push(safeNext(params?.get("next") ?? null));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  const off = !session.loading && !session.accounts;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" aria-label="Crawlspace home" className="self-start">
          <CrawlspaceLogo />
        </Link>

        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-12">
          <h1 className="text-[30px] leading-tight">{isSignup ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-2 text-[15px] text-ink-dim">
            {isSignup ? "Save every audit and share reports. Free, no card." : "Log in to see your saved audits."}
          </p>

          {off && (
            <div role="status" className="mt-6 rounded-xl border border-line bg-surface p-4 text-[13.5px] leading-relaxed text-ink-dim">
              <div className="bracket mb-1">[ accounts are off here ]</div>
              This deployment has no storage connected, so it cannot keep accounts yet. Audits work
              without one —{" "}
              <Link href="/" className="text-signal underline underline-offset-4">
                run one now
              </Link>
              .
            </div>
          )}

          <form onSubmit={submit} className="mt-8 space-y-4" aria-describedby={error ? "auth-error" : undefined}>
            {isSignup && (
              <div>
                <label htmlFor="name" className="field-label">
                  Name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  className="field"
                  disabled={off}
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@company.com"
                className="field"
                disabled={off}
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="password" className="field-label">
                  Password
                </label>
                {isSignup && <span className="text-[12px] text-ink-faint">8+ characters</span>}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  required
                  minLength={isSignup ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  className="field pr-11"
                  disabled={off}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-faint hover:bg-void hover:text-ink"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p id="auth-error" role="alert" className="rounded-lg bg-tint-bad px-3 py-2 text-[13.5px] text-danger">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy || off} className="btn-primary w-full !py-2.5">
              {busy ? (isSignup ? "Creating account…" : "Logging in…") : isSignup ? "Create account" : "Log in"}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-[14px] text-ink-dim">
            {isSignup ? "Already have an account? " : "New to Crawlspace? "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-medium text-signal underline-offset-4 hover:underline"
            >
              {isSignup ? "Log in" : "Create an account"}
            </Link>
          </p>
          {isSignup && (
            <p className="mt-4 text-center text-[12px] leading-relaxed text-ink-faint">
              By creating an account you agree to the{" "}
              <Link href="/terms" className="underline underline-offset-2">
                terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline underline-offset-2">
                privacy policy
              </Link>
              .
            </p>
          )}
        </div>
      </div>

      {/* Brand side */}
      <div className="relative hidden overflow-hidden border-l border-line bg-surface lg:block">
        <div className="grid-cells absolute inset-0 opacity-60" />
        <AsciiField shape="orb" accent className="absolute inset-0 h-full w-full opacity-70" cell={10} />
        <span className="mono absolute left-6 top-6 text-[11px] text-ink-faint/70">[ ACCOUNT ]</span>
        <span className="mono absolute bottom-6 right-6 text-[11px] text-ink-faint/70">[ HISTORY ]</span>
        <div className="relative flex h-full items-end p-12">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface/90 p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.25)] backdrop-blur">
            <div className="bracket">
              [ <b>with an account</b> ]
            </div>
            <ul className="mt-4 space-y-3">
              {PERKS.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[14.5px] text-ink">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-wash text-signal">
                    <Check className="h-3 w-3" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
