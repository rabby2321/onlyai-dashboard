// components/shell/BalancePill.tsx
"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";

export default function BalancePill({
  authed,
  initial,
}: {
  authed: boolean;
  initial?: number;
}) {
  const [cents, setCents] = useState<number>(initial ?? 0);

  useEffect(() => {
    if (!authed) {
      setCents(0);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const refresh = async () => {
      try {
        const r = await fetch("/api/wallet/me", { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          if (!cancelled) setCents(j.balanceC ?? 0);
        }
      } finally {
        timer = setTimeout(refresh, 15_000);
      }
    };

    refresh();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [authed]);

  if (!authed) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10
                    bg-gradient-to-r from-cyan-500/15 to-blue-500/15
                    px-6 py-2.5 text-base leading-none shadow-sm
                    backdrop-blur supports-[backdrop-filter]:bg-zinc-950/30">
      <Wallet className="h-5 w-5 text-cyan-300" />
      <span className="text-zinc-300">Balance</span>
      <span className="font-bold text-white tabular-nums">
        ${(cents / 100).toFixed(2)}
      </span>
    </div>
  );
}
