// components/proxy/ProxyCard.tsx
"use client";

import { useState } from "react";
import { Clock, Copy, ShieldCheck } from "lucide-react";

type Props = {
  planName: string;
  days: number;
  host: string;
  port: number;
  username: string;
  password: string;
  endsAt: string | Date;
};

export default function ProxyCard({
  planName,
  days,
  host,
  port,
  username,
  password,
  endsAt,
}: Props) {
  const [copied, setCopied] = useState<"socks" | "http" | null>(null);

  // remove any "(xx days)" suffix if it exists in DB
  const cleanName = planName.replace(/\s*\(\s*\d+\s*days?\s*\)\s*$/i, "").trim();

  const socks = `socks5://${encodeURIComponent(username)}:${encodeURIComponent(
    password
  )}@${host}:${port}`;
  const http = `http://${encodeURIComponent(username)}:${encodeURIComponent(
    password
  )}@${host}:${port}`;

  async function copy(text: string, which: "socks" | "http") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1200);
    } catch {}
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950 p-6 shadow-sm ring-1 ring-white/5 hover:border-zinc-700 hover:shadow-lg hover:shadow-cyan-500/5 transition">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div className="text-sm text-zinc-300">
          {/* ✅ Force the display title */}
          <div className="font-medium text-white">5G Mobile Proxy</div>
          <div className="text-xs text-zinc-500">({days} days)</div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-200">
          <ShieldCheck className="h-3 w-3" />
          SOCKS5 &amp; HTTP(S)
        </span>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Field label="Host" value={host} />
        <Field label="Port" value={String(port)} />
        <Field label="Username" value={username} />
        {/* ✅ Show actual password */}
        <Field label="Password" value={password} />
      </div>

      {/* Connect strings */}
      <ConnectRow
        label="Connect (SOCKS5)"
        value={socks}
        copied={copied === "socks"}
        onCopy={() => copy(socks, "socks")}
      />
      <ConnectRow
        label="Connect (HTTP/S)"
        value={http}
        copied={copied === "http"}
        onCopy={() => copy(http, "http")}
      />

      {/* Footer */}
      <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
        <Clock className="h-3.5 w-3.5" />
        Expires: {new Date(endsAt).toLocaleString()}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200">
        {value}
      </div>
    </label>
  );
}

function ConnectRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="mt-4">
      <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-[13px] text-zinc-200 whitespace-nowrap overflow-x-auto">
          {value}
        </code>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800/80"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
