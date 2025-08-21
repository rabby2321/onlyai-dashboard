// app/api/wallet/topup/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Stripe from "stripe";

export const dynamic = "force-dynamic"; // don't cache this route

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId;
  if (!userId) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  const { amountC } = await req.json();
  if (!amountC || amountC < 100) {
    return Response.json({ error: "Invalid amount" }, { status: 400 });
  }

  // ✅ Build absolute URLs from the current request's origin
  const origin = new URL(req.url).origin;
  const success_url = `${origin}/wallet?ok=1`;
  const cancel_url  = `${origin}/wallet`;

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url,
    cancel_url,
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
    metadata: { userId },
  });

  return Response.json({ url: checkout.url });
}
