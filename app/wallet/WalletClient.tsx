// app/wallet/WalletClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function WalletClient() {
  const router = useRouter();
  const sp = useSearchParams();

  // Keep old look: typed dollars + preset chips
  const [dollars, setDollars] = useState<string>("100"); // default $100 like your old UI
  const [loading, setLoading] = useState<"stripe" | "nowp" | null>(null);

  // to-cents helper (whole dollars only; server still validates)
  const amountC = useMemo(() => {
    const n = Number(dollars.replace(/[^\d]/g, ""));
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n)) * 100;
  }, [dollars]);

  // Handle Stripe/NOWP return (?ok=1[&provider=stripe&session_id=...])
  const confirmedRef = useRef(false);
  const ok = sp.get("ok");
  const provider = sp.get("provider");
  const sessionId = sp.get("session_id");

  useEffect(() => {
    // If we came back from Stripe with a session_id, confirm once, then clean URL
    if (ok === "1" && provider === "stripe" && sessionId && !confirmedRef.current) {
      confirmedRef.current = true;
      (async () => {
        try {
          await fetch("/api/stripe/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId }),
          });
        } catch {
          // no-op; webhook retry will backstop this if needed
        } finally {
          router.replace("/wallet");
          router.refresh();
        }
      })();
      return;
    }

    // If it's a NOWPayments success (or Stripe without session id), just clean the URL
    if (ok === "1" && !confirmedRef.current) {
      confirmedRef.current = true;
      router.replace("/wallet");
      router.refresh();
    }
  }, [ok, provider, sessionId, router]);

  // Actions
  async function payStripe() {
    if (amountC < 500 || amountC > 100000) {
      alert("Enter $5–$1000 (whole dollars).");
      return;
    }
    setLoading("stripe");
    try {
      const r = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountC }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.url) window.location.href = j.url;
      else alert(j.error || "Stripe failed");
    } finally {
      setLoading(null);
    }
  }

  async function payNOWP() {
    if (amountC < 500 || amountC > 100000) {
      alert("Enter $5–$1000 (whole dollars).");
      return;
    }
    setLoading("nowp");
    try {
      const r = await fetch("/api/wallet/nowp/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountC }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.url) window.location.href = j.url;
      else alert(j.error || "Crypto checkout failed");
    } finally {
      setLoading(null);
    }
  }

  // Preset chips (old layout had 25/50/100/200)
  const presets = [25, 50, 100, 200];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="text-lg font-medium">Add balance</div>

        {/* amount input row (old look) */}
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-2 text-zinc-400">$</span>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-32 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-white/10"
            placeholder="Amount"
            value={dollars}
            onChange={(e) => setDollars(e.target.value)}
          />
          <span className="text-xs text-zinc-500">USD (whole dollars, $5–$1000)</span>
        </div>

        {/* preset chips (old look) */}
        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((p) => {
            const active = Number(dollars) === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setDollars(String(p))}
                className={[
                  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[.98]",
                  active
                    ? "text-white border border-white/10 shadow-sm bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
                    : "text-zinc-300 border border-transparent hover:bg-white/5",
                ].join(" ")}
              >
                ${p}
              </button>
            );
          })}
        </div>

        {/* CTAs (old look) */}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={payStripe}
            disabled={loading !== null}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white border border-white/10 shadow-sm bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 disabled:opacity-50 active:scale-[.98]"
          >
            {loading === "stripe" ? "Redirecting…" : "Pay with Card (Stripe)"}
          </button>

          <button
            type="button"
            onClick={payNOWP}
            disabled={loading !== null}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white border border-white/10 shadow-sm border-emerald-400/40 bg-emerald-400/15 hover:bg-emerald-400/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:opacity-50 active:scale-[.98]"
          >
            {loading === "nowp" ? "Opening…" : "Pay with Crypto (NOWPayments)"}
          </button>
        </div>
      </div>
    </div>
  );
}
