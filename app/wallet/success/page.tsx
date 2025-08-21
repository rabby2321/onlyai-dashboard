// app/wallet/success/page.tsx
import Stripe from "stripe";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SuccessPage({
  // Next 15: searchParams is a Promise
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const sp = await searchParams;
  const sid =
    typeof sp.session_id === "string"
      ? sp.session_id
      : Array.isArray(sp.session_id)
      ? sp.session_id[0]
      : undefined;

  let paid = false;
  let amountC = 0;
  let receiptUrl: string | null = null;

  if (sid) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
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
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-zinc-950 p-8 shadow-[0_0_80px_-30px] shadow-emerald-500/40">
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
            <svg viewBox="0 0 24 24" className="h-10 w-10 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-semibold">
              {paid ? "Payment successful" : "Payment processing"}
            </h1>
            <p className="mt-1 text-zinc-400">
              {!sid
                ? "Missing session_id."
                : paid
                ? <>We received <span className="text-emerald-400 font-medium">{amount}</span>. Your wallet is updating.</>
                : "Your payment is processing. This usually takes a few seconds."}
            </p>
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap gap-3">
          <Link href="/wallet" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm hover:bg-emerald-500/15">Back to Wallet</Link>
          <Link href="/shop" className="rounded-lg border border-zinc-800 bg-white/10 px-3 py-2 text-sm hover:bg-white/15">Go to Shop</Link>
          <Link href="/my/proxy" className="rounded-lg border border-zinc-800 bg-white/10 px-3 py-2 text-sm hover:bg-white/15">My Proxies</Link>
          {receiptUrl && (
            <a href={receiptUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-zinc-800 bg-white/10 px-3 py-2 text-sm hover:bg-white/15">
              View Receipt
            </a>
          )}
        </div>
      </div>

      {/* refresh header balance + safe confetti (no template literals inside) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              window.dispatchEvent(new Event('wallet:update'));
              var n = 36;
              var container = document.createElement('div');
              container.style.position='fixed';
              container.style.inset='0';
              container.style.pointerEvents='none';
              container.style.zIndex='50';
              document.body.appendChild(container);
              for (var i=0;i<n;i++){
                var p=document.createElement('div');
                p.style.position='absolute';
                p.style.left='50%';
                p.style.top='20%';
                p.style.width='10px';
                p.style.height='10px';
                p.style.background=['#34d399','#22d3ee','#fde047','#f472b6'][i%4];
                p.style.borderRadius='1px';
                p.style.opacity='0.9';
                var dx=(Math.random()*2-1)*200;
                var dy=100+Math.random()*200;
                var rot=(Math.random()*720-360);
                var dur=900+Math.random()*600;
                var to='translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) rotate(' + rot + 'deg) scale(0.9)';
                p.animate([
                  { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
                  { transform: to, opacity: 0 }
                ], { duration: dur, easing: 'cubic-bezier(0.2,0.8,0.2,1)', fill: 'forwards' });
                container.appendChild(p);
              }
              setTimeout(function(){ container.remove(); }, 1600);
            })();
          `,
        }}
      />
    </div>
  );
}
