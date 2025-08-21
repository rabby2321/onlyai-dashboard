import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function validateAmountC(raw: any) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const dollars = n / 100;
  if (!Number.isInteger(dollars)) return null; // whole dollars only
  if (dollars < 5 || dollars > 1000) return null;
  return n;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amountC: raw } = await req.json();
  const amountC = validateAmountC(raw);
  if (!amountC) return NextResponse.json({ error: "Amount must be $5–$1000, whole dollars." }, { status: 400 });

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${process.env.NEXTAUTH_URL}/wallet?ok=1`,
    cancel_url: `${process.env.NEXTAUTH_URL}/wallet`,
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: "Wallet Top-up" },
        unit_amount: amountC,
      },
      quantity: 1,
    }],
    metadata: { userId },
    payment_intent_data: { metadata: { userId } },
  });

  return NextResponse.json({ url: checkout.url });
}
