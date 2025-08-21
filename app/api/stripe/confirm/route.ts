import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

async function creditOnce(userId: string, amountC: number, ref: string, meta: any) {
  const existing = await prisma.txn.findFirst({ where: { ref } });
  if (existing) return;
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
  if (!session_id) return new Response("missing session_id", { status: 400 });

  const cs = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ["payment_intent"],
  });

  if (cs.payment_status !== "paid") {
    return new Response("not paid", { status: 400 });
  }

  const userId = (cs.metadata?.userId as string) || "";
  const amountC = Number(cs.amount_total ?? 0);
  await creditOnce(userId, amountC, `cs_${cs.id}`, cs);

  return new Response("ok");
}
