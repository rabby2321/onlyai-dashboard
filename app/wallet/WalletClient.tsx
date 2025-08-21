"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default function WalletClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const ok = sp.get("ok");

  useEffect(() => {
    if (ok) router.replace("/wallet");
  }, [ok, router]);

  // store cents; default $100
  const [amountC, setAmountC] = useState(10000);
  const [rawUSD, setRawUSD] = useState("100"); // text input
  const [loading, setLoading] = useState(false);

  // validate $5–$1000 whole dollars
  const valid = useMemo(() => {
    const n = Number(rawUSD);
    return Number.isInteger(n) && n >= 5 && n <= 1000;
  }, [rawUSD]);

  useEffect(() => {
    const n = Number(rawUSD);
    if (Number.isInteger(n)) setAmountC(n * 100);
  }, [rawUSD]);

  function preset(dollars: number) {
    setRawUSD(String(dollars));
    setAmountC(dollars * 100);
  }

  async function go(path: string) {
    if (!valid) {
      alert("Enter a whole-dollar amount between $5 and $1000.");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountC }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.url) window.location.href = j.url;
      else alert(j.error || "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <CardTitle className="text-lg">Add balance</CardTitle>

        {/* custom amount */}
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-2 text-zinc-400">$</span>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-32 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-white/10"
            placeholder="Amount"
            value={rawUSD}
            onChange={(e) => setRawUSD(e.target.value.replace(/[^\d]/g, ""))}
          />
          <span className="text-xs text-zinc-500">USD (whole dollars, $5–$1000)</span>
        </div>

        {/* quick presets */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[25, 50, 100, 200].map((d) => (
            <Button
              key={d}
              variant={Number(rawUSD) === d ? undefined : "ghost"}
              className={Number(rawUSD) === d ? "border-white/20 bg-white/10" : ""}
              onClick={() => preset(d)}
            >
              ${d}
            </Button>
          ))}
        </div>

        {/* pay buttons */}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => go("/api/wallet/topup")} disabled={loading || !valid}>
            {loading ? "Redirecting…" : "Pay with Card (Stripe)"}
          </Button>
          <Button
            onClick={() => go("/api/wallet/nowp/create")}
            disabled={loading || !valid}
            className="border-emerald-400/40 bg-emerald-400/15 hover:bg-emerald-400/25"
          >
            {loading ? "Redirecting…" : "Pay with Crypto (NOWPayments)"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
