import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

async function creditOnce(userId: string, amountC: number, ref: string, meta: any) {
  if (!userId || !amountC || !ref) return;
  const exists = await prisma.txn.findFirst({ where: { ref } });
  if (exists) return;
  await prisma.$transaction(async (tx) => {
    await tx.wallet.upsert({
      where: { userId },
      create: { userId, balanceC: amountC },
      update: { balanceC: { increment: amountC } },
    });
    await tx.txn.create({ data: { userId, type: "CREDIT", amountC, ref, meta } });
  });
}

export async function POST(req: Request) {
  const { session_id } = await req.json().catch(() => ({}));
  if (!session_id) return NextResponse.json({ error: "missing session_id" }, { status: 400 });

  const s = await stripe.checkout.sessions.retrieve(session_id);
  if (!s || s.payment_status !== "paid") return NextResponse.json({ ok: false });

  const userId = (s.metadata?.userId as string) || "";
  const amountC = s.amount_total ?? 0;
  await creditOnce(userId, amountC, `stripe_${s.id}`, s);

  return NextResponse.json({ ok: true });
}
