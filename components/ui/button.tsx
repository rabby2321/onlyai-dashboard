"use client";

import * as React from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 " +
  "disabled:opacity-50 disabled:pointer-events-none active:scale-[.98]";

const byVariant: Record<Variant, string> = {
  primary:
    "text-white border border-white/10 shadow-sm " +
    "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400",
  secondary:
    "text-cyan-100 border border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/15",
  outline:
    "text-zinc-100 border border-zinc-700 bg-transparent hover:bg-white/5",
  ghost:
    "text-zinc-300 border border-transparent hover:bg-white/5",
  danger:
    "text-white border border-rose-400/30 bg-rose-600 hover:bg-rose-500",
};

const bySize: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

export function Button({ className = "", variant = "primary", size = "md", ...props }: ButtonProps) {
  return <button className={`${base} ${byVariant[variant]} ${bySize[size]} ${className}`} {...props} />;
}

export default Button;
