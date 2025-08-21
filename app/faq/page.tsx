"use client";

import { useState } from "react";
import { Plus, Minus, ExternalLink } from "lucide-react";

function QA({
  q,
  children,
  defaultOpen = false,
}: {
  q: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl bg-gradient-to-b from-cyan-500/10 to-blue-500/10 p-[1px]">
      <details
        open={open}
        onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
        className="rounded-[11px] border border-zinc-800/70 bg-zinc-950/80 backdrop-blur"
      >
        <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 hover:bg-white/5">
          <span className="text-sm font-medium text-zinc-100">{q}</span>
          <span
            className={[
              "flex h-7 w-7 items-center justify-center rounded-lg ring-1 transition",
              open
                ? "bg-violet-500/20 text-violet-200 ring-violet-500/40"
                : "bg-zinc-800 text-zinc-400 ring-zinc-700/60",
            ].join(" ")}
            aria-hidden
          >
            {open ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          </span>
        </summary>
        <div className="px-4 pb-4 text-sm leading-relaxed text-zinc-300">{children}</div>
      </details>
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="mx-auto w-full max-w-3xl p-6 text-zinc-100">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">FAQ</h1>
        <p className="text-sm text-zinc-400">OnlyAI Proxies • Verizon 5G • US, LA endpoints</p>
      </header>

      <div className="space-y-3">
        <QA q="Is there a free trial?" defaultOpen>
          Message us on Telegram at {" "}
          <a className="underline" href="https://t.me/OnlyAiProxySupport" target="_blank" rel="noreferrer">
            @OnlyAiProxySupport <ExternalLink className="inline h-3 w-3" /></a>  with the email address that was used to create an account on our dashboard. Well provide access to a 12 hour trial with 300 MB of traffic.
          
        </QA>

        <QA q="How fast is provisioning after payment?">
          Provisioning is instant. Once the payment clears, your proxy appears under <span className="font-mono">My Proxies</span>.
        </QA>

        <QA q="Which network do you use?">
          All proxies run on <strong>Verizon 5G</strong> in the U.S. Our current pool is anchored in Los Angeles (US, LA endpoints).
        </QA>

        <QA q="What protocols are supported?">
          HTTPS and SOCKS5 are supported.
        </QA>

        <QA q="What speeds should I expect?">
          On Verizon 5G, bursts up to <strong>~100&nbsp;Mbps</strong> are possible; typical sustained throughput is <strong>30–80&nbsp;Mbps</strong>.
        </QA>

        <QA q="How does IP rotation work?">
          Our default  IP rotation is every <strong>10 minutes</strong>; we can adjust the interval on request.
        </QA>

        <QA q="How many IPs per proxy?">
          A single proxy maps to a live Verizon 5G connection. The public IP changes over time (dynamic pool).
        </QA>

        <QA q="How many threads can I run?">
          Practically, <strong>10–20 concurrent threads</strong> are stable for most workloads. Ramp gradually and monitor rate limits.
        </QA>

        <QA q="Will it work with my bots / SEO tools?">
          Yes—anything that supports HTTPS/SOCKS5 with user/pass auth works.
        </QA>

        <QA q="How do I get support?">
          DM us on Telegram:{" "}
          <a className="underline" href="https://t.me/OnlyAiProxySupport" target="_blank" rel="noreferrer">
            @OnlyAiProxySupport <ExternalLink className="inline h-3 w-3" />
          </a>.
        </QA>
      </div>
    </div>
  );
}
