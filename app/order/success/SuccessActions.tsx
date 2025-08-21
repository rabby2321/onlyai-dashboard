"use client";
import { useState } from "react";

export default function SuccessActions({ proxyString }: { proxyString: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(proxyString);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // no-op
    }
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button
        onClick={copy}
        className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-500/25"
      >
        {copied ? "Copied!" : "Copy connect string"}
      </button>

      <a
        href="/my/proxy"
        className="rounded-lg border border-zinc-800 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
      >
        My Proxies
      </a>

      <a
        href="/shop"
        className="rounded-lg border border-zinc-800 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
      >
        Buy another
      </a>
    </div>
  );
}
