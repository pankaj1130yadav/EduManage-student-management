"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sign in failed");
      router.push(data.redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(which: "admin" | "teacher" | "student") {
    const map = {
      admin: "admin@edumanage.local",
      teacher: "meera.iyer@edumanage.local",
      student: "aarav.sharma@edumanage.local",
    };
    setEmail(map[which]);
    setPassword("password123");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-sm bg-forest font-display text-2xl font-bold text-gold-soft shadow-ledger">
            E
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
            EduManage
          </h1>
          <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-ink-faint">
            Sign the attendance register
          </p>
        </div>

        <div className="register-frame rounded-sm bg-paper-card p-8 shadow-ledger">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@edumanage.local"
                className="w-full rounded-sm border border-paper-line bg-paper px-3.5 py-2.5 text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-sm border border-paper-line bg-paper px-3.5 py-2.5 text-ink outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/15"
              />
            </div>
            {error && (
              <p className="rounded-sm border border-ledger-red/30 bg-ledger-red/5 px-3 py-2 text-sm font-medium text-ledger-red">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-sm bg-forest py-3 font-display text-lg font-semibold text-paper shadow-ledger transition hover:bg-forest-deep disabled:opacity-60"
            >
              {busy ? "Opening the ledger…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 border-t border-dashed border-paper-line pt-5">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
              Demo sign-ins
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["admin", "teacher", "student"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => fillDemo(r)}
                  className="rounded-sm border border-paper-line bg-paper px-2 py-2 text-xs font-semibold capitalize text-forest transition hover:border-forest hover:bg-forest-mist"
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-ink-faint">
              Password for all demo accounts:{" "}
              <code className="font-semibold text-ink-soft">password123</code>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-ink-faint">
          <Link href="/" className="underline decoration-gold-deep/50 underline-offset-4 hover:text-forest">
            ← Back to the front page
          </Link>
        </p>
      </div>
    </main>
  );
}
