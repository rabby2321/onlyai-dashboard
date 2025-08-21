// app/wallet/success/page.tsx
import React from "react";
import Stripe from "stripe";
import Link from "next/link";

export const runtime = "nodejs";        // Stripe needs Node
export const dynamic = "force-dynamic"; // always fresh

export default async function SuccessPage({
  searchParams,
}: { searchParams: { session_id?: string } }) {
  const sid = searchParams?.session_id;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  let paid = false;
  let amountC = 0;
  let receiptUrl: string | null = null;

  if (sid) {
    const s = await stripe.checkout.sessions.retrieve(sid);
    paid = s.payment_status === "paid";
    amountC = (s.amount_total ?? 0) as number;
    const piId = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
    if (piId) {
      const pi = await stripe.paymentIntents.retrieve(piId, { expand: ["charges"] });
      receiptUrl = (pi.charges?.data?.[0]?.receipt_url as string) ?? null;
    }
  }

  const amount = `$${(amountC / 100).toFixed(2)}`;

  return (
    <div className="mx-auto w-full max-w-3xl p-6 text-zinc-100">
      {/* v2 marker so you can visually confirm the new file is live */}
      <div className="mb-2 text-xs text-zinc-500">success page v2</div>

      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-zinc-950 p-8 shadow-[0_0_80px_-30px] shadow-emerald-500/40">
        {/* simple glow without Tailwind arbitrary values */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "-100px",
            pointerEvents: "none",
            background:
              "radial-gradient(closest-side, rgba(16,185,129,0.18), transparent 65%)",
          }}
        />

        <div className="relative flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30">
            <svg
              viewBox="0 0 24 24"
              className="h-10 w-10 text-emerald-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-semibold">
              {paid ? "Payment successful" : "Payment processing"}
            </h1>
            <p className="mt-1 text-zinc-400">
              {sid
                ? paid
                  ? <>We received <span className="text-emerald-400 font-medium">{amount}</span>. Your wallet is updating.</>
                  : "Your payment is processing. This usually takes a few seconds."
                : "Missing session_id."}
            </p>
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap gap-3">
          <Link href="/wallet" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm hover:bg-emerald-500/15">
            Back to Wallet
          </Link>
          <Link href="/shop" className="rounded-lg border border-zinc-800 bg-white/10 px-3 py-2 text-sm hover:bg-white/15">
            Go to Shop
          </Link>
          <Link href="/my/proxy" className="rounded-lg border border-zinc-800 bg-white/10 px-3 py-2 text-sm hover:bg-white/15">
            My Proxies
          </Link>
          {receiptUrl && (
            <a href={receiptUrl} target="_blank" rel="noreferrer"
               className="rounded-lg border border-zinc-800 bg-white/10 px-3 py-2 text-sm hover:bg-white/15">
              View Receipt
            </a>
          )}
        </div>
      </div>

      {/* refresh header balance immediately */}
      <script dangerouslySetInnerHTML={{ __html: "window.dispatchEvent(new Event('wallet:update'))" }} />
    </div>
  );
}
