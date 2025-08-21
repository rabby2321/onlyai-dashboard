// app/wallet/WalletClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function WalletClient() {
  const router = useRouter();
  const sp = useSearchParams();

  // Handle Stripe post-checkout: /wallet?ok=1&provider=stripe&session_id=cs_...
  useEffect(() => {
    const ok = sp.get("ok");
    const provider = sp.get("provider");
    const sid = sp.get("session_id");

    if (ok === "1" && provider === "stripe" && sid) {
      // prevent double-credit on hard refresh
      const guardKey = `stripe_confirmed:${sid}`;
      if (sessionStorage.getItem(guardKey)) {
        router.replace("/wallet");
        return;
      }

      (async () => {
        try {
          await fetch("/api/stripe/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sid }),
          });
        } catch {
          // ignore; webhook may still credit later
        } finally {
          sessionStorage.setItem(guardKey, "1");
          router.replace("/wallet"); // remove query params
        }
      })();
    } else if (ok === "1") {
      // Non-Stripe success (e.g., NOWPayments): just clean the URL
      router.replace("/wallet");
    }
  }, [sp, router]);

  // ---- Simple top-up UI (Stripe) ----
  const [amountC, setAmountC] = useState(1000); // $10 default
  const [loading, setLoading] = useState(false);

  async function topupStripe() {
    setLoading(true);
    try {
      const r = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountC }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.url) {
        window.location.href = j.url;
      } else {
        alert(j.error || "Stripe failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="text-lg font-medium">Add balance</div>

        <div className="mt-3 flex items-center gap-2">
          {[600, 2500, 8000].map((c) => (
            <button
              key={c}
              className={`rounded-md px-3 py-2 text-sm ${
                amountC === c ? "bg-white/15 border border-white/20" : "bg-zinc-900 border border-zinc-800"
              }`}
              onClick={() => setAmountC(c)}
            >
              ${(c / 100).toFixed(0)}
            </button>
          ))}

          <div className="ml-2 flex items-center gap-2">
            <span className="text-sm text-zinc-400">$</span>
            <input
              type="number"
              min={5}
              max={1000}
              step={1}
              value={Math.round(amountC / 100)}
              onChange={(e) => setAmountC(Math.max(5, Math.min(1000, Number(e.target.value))) * 100)}
              className="w-24 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-sm outline-none"
            />
          </div>
        </div>

        <button
          className="mt-4 rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/15 disabled:opacity-50"
          onClick={topupStripe}
          disabled={loading}
        >
          {loading ? "Redirecting…" : "Pay with Card (Stripe)"}
        </button>
      </div>
    </div>
  );
}
