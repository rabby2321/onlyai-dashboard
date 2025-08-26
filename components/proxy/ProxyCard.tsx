// components/proxy/ProxyCard.tsx
"use client";

import { useEffect, useState } from "react";
import { Clock, Copy, ShieldCheck, RotateCw, CheckCircle2, AlertTriangle } from "lucide-react";

type Props = {
  endpointId?: string;
  planName: string;
  days: number;
  host: string;
  port: number;
  username: string;
  password: string;
  endsAt: string | Date;

  /** Preferred: server route will call vendor & avoid CORS */
  allocationId?: string;

  /** Fallback: direct vendor URL (may fail off-LAN / CORS) */
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
  }

  // auto-dismiss toast
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 1800);
    return () => clearTimeout(t);
  }, [feedback]);

  async function rotate() {
    if (rotating) return;
    setRotating(true);
    try {
      if (allocationId) {
        const r = await fetch("/api/proxy/rotate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ allocationId }),
        });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j.ok !== false) {
          toast("success", j.message || "Rotated successfully!");
        } else {
          toast("error", j.error || j.message || "Rotation failed");
        }
        return;
      }

      if (rotateUrl) {
        const r = await fetch(rotateUrl, { method: "GET", headers: { accept: "application/json,*/*" } });
        let msg = "Rotated successfully!";
        const ct = r.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const j = await r.json().catch(() => null);
          if (j && typeof j === "object" && (j as any).message) msg = (j as any).message as string;
        } else {
          const txt = await r.text().catch(() => "");
          if (txt) msg = txt.slice(0, 200);
        }
        if (!r.ok) toast("error", "Rotation failed");
        else toast("success", msg);
        return;
      }

      toast("error", "Rotate not configured");
    } catch {
      toast("error", "Rotation failed");
    } finally {
      setRotating(false);
    }
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950 p-6 shadow-sm ring-1 ring-white/5 hover:border-zinc-700 hover:shadow-lg hover:shadow-cyan-500/5 transition">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div className="text-sm text-zinc-300">
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

      {/* Fixed, pretty bottom-right toast (never clipped by cards) */}
      <Toast feedback={feedback} onClose={() => setFeedback(null)} />
    </>
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

function Toast({
  feedback,
  onClose,
}: {
  feedback: { type: "success" | "error"; message: string } | null;
  onClose: () => void;
}) {
  if (!feedback) return null;
  const isSuccess = feedback.type === "success";
  return (
    <div className="fixed bottom-5 right-5 z-[9999] animate-in fade-in slide-in-from-bottom-2">
      <div
        className={[
          "pointer-events-auto flex items-center gap-2 rounded-xl border px-3 py-2 shadow-lg backdrop-blur",
          isSuccess
            ? "border-green-500/30 bg-green-500/15 text-green-200"
            : "border-red-500/30 bg-red-500/15 text-red-200",
        ].join(" ")}
        role="status"
        aria-live="polite"
      >
        {isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        <span className="text-sm">{feedback.message}</span>
        <button
          onClick={onClose}
          className="ml-1 rounded px-1 text-xs text-white/70 hover:text-white/90"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
