import React from "react";
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={"rounded-xl border border-zinc-800 bg-zinc-950 p-5 " + className}>{children}</div>
  );
}
export function CardTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-lg font-medium">{children}</div>;
}
export function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-xs uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="mt-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono">{value}</div>
    </div>
  );
}
