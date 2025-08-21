"use client";
import { useState } from "react";

export default function CopyButton({ value, label = "Copy connect string" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      alert("Copy failed");
    }
  }

  return (
    <button
      onClick={copy}
      className="mt-2 rounded-lg border border-zinc-800 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
