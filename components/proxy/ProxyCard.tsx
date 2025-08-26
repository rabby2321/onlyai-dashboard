// components/proxy/ProxyCard.tsx
"use client";

import { useState } from "react";
import { Clock, Copy, ShieldCheck, RotateCw, CheckCircle2, AlertTriangle } from "lucide-react";

type Props = {
  planName: string;
  days: number;
  host: string;
  port: number;
  username: string;
  password: string;
  endsAt: string | Date;

  /** Optional: preferred way (server calls vendor and checks auth) */
  allocationId?: string;

  /** Optional fallback: full vendor URL like:
   *   http://192.168.12.219/selling/rotate?token=XXXX
   * Will be fetched from the browser (may be blocked by CORS off-network).
   */
  rotateUrl?: string;
};

export default function ProxyCard({
  planName,
  days,
  host,
  port,
  username,
  password,
  endsAt,
  allocationId,
  rotateUrl,
}: Props) {
  const [copied, setCopied] = useState<"socks" | "http" | null>(null);
  const [rotating, setRotating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  function toast(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 1800);
  }

  async function rotate() {
    if (rotating) return;
    setRotating(true);
    try {
      // Preferred: go through our server route (auth + no CORS headaches)
      if (allocationId) {
        const r = await fetch("/api/proxy/rotate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ allocationId }),
        });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j.ok !== false) {
          toast("success", j.message || "Rotate successfully!");
        } else {
          toast("error", j.error || j.message || "Rotation failed");
        }
        return;
      }

      // Fallback: direct vendor URL (works only if accessible & CORS allows it)
      if (rotateUrl) {
        const r = await fetch(rotateUrl, { method: "GET", headers: { accept: "application/json,*/*" } });
        let msg = "Rotate successfully!";
        const ct = r.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const j = await r.json().catch(() => null);
          if (j && typeof j === "object" && (j as any).message) msg = (j as any).message as string;
        } else {
          const txt = await r.text().catch(() => "");
          if (txt) msg = txt.slice(0, 200);
        }
        if (!r.ok) {
          toast("error", "Rotation failed");
        } else {
          toast("success", msg);
        }
        return;
      }

      toast("error", "Rotate not configured");
    } catch (e) {
      toast("error", "Rotation failed");
    } finally {
      setRotating(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950 p-6 shadow-sm ring-1 ring-white/5 hover:border-zinc-700 hover:shadow-lg hover:shadow-cyan-500/5 transition">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

      {/* Tiny popup */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`absolute right-3 top-3 z-10 flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
            feedback.type === "success"
              ? "border-green-500/30 bg-green-500/15 text-green-200"
              : "border-red-500/30 bg-red-500/15 text-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <span className="whitespace-nowrap">{feedback.message}</span>
        </div>
      )}

      {/* Header (kept your original look; added Rotate button on the right) */}
      <div className="mb-5 flex items-start justify-between">
        <div className="text-sm text-zinc-300">
          {/* ✅ Force the display title */}
          <div className="font-medium text-white">5G Mobile Proxy</div>
          <div className="text-xs text-zinc-500">({days} days)</div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-200">
            <ShieldCheck className="h-3 w-3" />
            SOCKS5 &amp; HTTP(S)
          </span>

          <button
            onClick={rotate}
            disabled={rotating || (!allocationId && !rotateUrl)}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-medium text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
            title={allocationId || rotateUrl ? "Rotate IP now" : "Rotate not configured"}
          >
            <RotateCw className={`h-3.5 w-3.5 ${rotating ? "animate-spin" : ""}`} />
            {rotating ? "Rotating…" : "Rotate IP"}
          </button>
        </div>
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
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-200">{value}</div>
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
