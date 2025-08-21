import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(req: Request) {
  const { session_id } = await req.json().catch(() => ({}));
  if (!session_id) return Response.json({ error: "Missing session_id" }, { status: 400 });

  const cs = await stripe.checkout.sessions.retrieve(session_id, { expand: ["payment_intent"] });
  if (cs.payment_status !== "paid") return Response.json({ error: "Not paid" }, { status: 400 });

  const userId = (cs.metadata?.userId as string) || "";
  const amountC = cs.amount_total ?? 0;
  const piId = typeof cs.payment_intent === "string" ? cs.payment_intent : cs.payment_intent?.id;
  const ref = `stripe_pi_${piId || cs.id}`;

  if (!userId || !amountC) return Response.json({ error: "Missing metadata" }, { status: 400 });

  const exists = await prisma.txn.findFirst({ where: { ref } });
  if (exists) return Response.json({ ok: true, credited: true });

  await prisma.$transaction(async (tx) => {
    await tx.wallet.upsert({
      where: { userId },
      create: { userId, balanceC: amountC },
      update: { balanceC: { increment: amountC } },
    });
    await tx.txn.create({
      data: { userId, type: "CREDIT", amountC, ref, meta: { source: "stripe-confirm" } },
    });
  });

  return Response.json({ ok: true });
}
