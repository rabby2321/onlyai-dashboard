// app/api/wallet/topup/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId as string | undefined;
  if (!userId) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const amountC = Number.parseInt(String(body.amountC), 10);

  // cents, whole dollars enforced elsewhere; keep min $1 here to be permissive
  if (!Number.isFinite(amountC) || amountC < 100) {
    return Response.json({ error: "Invalid amount" }, { status: 400 });
  }

  const origin = new URL(req.url).origin;

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/wallet?ok=1&provider=stripe&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/wallet`,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Wallet top-up" },
          unit_amount: amountC,
        },
        quantity: 1,
      },
    ],
    // keep userId on both objects so either confirm-flow or webhook can find it
    metadata: { userId },
    payment_intent_data: { metadata: { userId } },
  });

  return Response.json({ url: checkout.url });
}
