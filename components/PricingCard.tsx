"use client";

import { useState } from "react";
import { Check, Minus, ShoppingCart, CreditCard } from "lucide-react";
import Button from "@/components/ui/button";

type Plan = { id: string; name: string; priceC: number; durationD: number };

type Meta = {
  displayName?: string; // optional title override
  tag?: string;         // optional badge (e.g., "Up to 80–143 Mbps")
  features: Array<{ label: string; ok: boolean }>;
};

export default function PricingCard({
  plan,
  meta,
  balanceC,
}: {
  plan: Plan;
  meta: Meta;
  balanceC: number;
}) {
  const [loading, setLoading] = useState(false);
  const price = (plan.priceC / 100).toFixed(0);
  const canAfford = balanceC >= plan.priceC;

  async function buy() {
    if (!canAfford) {
      window.location.href = "/wallet";
      return;
    }
    try {
      setLoading(true);
      const r = await fetch("/api/shop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.allocId) {
        window.location.href = `/order/success?alloc=${encodeURIComponent(j.allocId)}`;
      } else {
        alert(j.error || "Purchase failed");
      }
    } finally {
      setLoading(false);
    }
  }

  // Always add "Unlimited data" as the last feature
  const featureList = [...meta.features, { label: "Unlimited data", ok: true }];

  return (
    <div className="group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-sm transition hover:border-zinc-700">
      {/* Badge (optional) */}
      {meta.tag && (
        <div className="mb-3 inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
          {meta.tag}
        </div>
      )}

      {/* Title & price */}
      <h3 className="mb-2 text-xl font-semibold text-white">
        {meta.displayName ?? plan.name}
      </h3>

      <div className="mb-4 flex items-end gap-2">
        <span className="text-4xl font-bold text-white">${price}</span>
        <div className="flex items-center gap-2 pb-1 text-sm text-zinc-400">
          <span>/{plan.durationD} days</span>
          <USFlag className="h-6 w-9 rounded-[2px] ring-1 ring-white/10" />
        </div>
      </div>

      {/* CTA */}
      <Button
        onClick={buy}
        disabled={loading}
        size="lg"
        variant={canAfford ? "primary" : "outline"}
        className="mb-6 w-full"
        aria-label={canAfford ? "Buy now" : "Add funds"}
        aria-busy={loading}
      >
        {loading ? (
          "Processing…"
        ) : canAfford ? (
          <>
            <ShoppingCart className="h-4 w-4" />
            Buy now
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            Add funds
          </>
        )}
      </Button>

      {/* Feature list */}
      <ul className="mt-auto space-y-3">
        {featureList.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-sm">
            {f.ok ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30">
                <Check className="h-3.5 w-3.5" />
              </span>
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700/50">
                <Minus className="h-3.5 w-3.5" />
              </span>
            )}
            <span className={f.ok ? "text-zinc-200" : "text-zinc-500"}>{f.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Minimal inline US flag SVG so no external asset is required */
function USFlag({ className = "h-4 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 7410 3900"
      className={className}
      aria-label="United States"
      role="img"
    >
      <rect width="7410" height="3900" fill="#b22234" />
      {/* white stripes */}
      {[...Array(6)].map((_, i) => (
        <rect key={i} y={(i * 2 + 1) * 300} width="7410" height="300" fill="#fff" />
      ))}
      {/* canton */}
      <rect width="2964" height="2100" fill="#3c3b6e" />
      {/* simple star field (reduced) */}
      {Array.from({ length: 6 }).map((_, r) =>
        Array.from({ length: 5 }).map((__, c) => (
          <circle
            key={`${r}-${c}`}
            cx={260 + c * 520}
            cy={220 + r * 340}
            r="60"
            fill="#fff"
          />
        )),
      )}
    </svg>
  );
}
