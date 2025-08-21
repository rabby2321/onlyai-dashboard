import Stripe from "stripe";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";         // IMPORTANT: Node runtime
export const dynamic = "force-dynamic";  // don’t cache

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

// set to true temporarily if you need to verify what’s present in prod logs
const DEBUG = false;

async function creditOnce(userId: string, amountC: number, ref: string, meta: any) {
  if (!userId || !amountC || !ref) return;
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
  const hdrs = await headers();
  const sig = hdrs.get("stripe-signature") ?? "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (DEBUG) {
    console.log("[stripe] sig present?", Boolean(sig));
    console.log("[stripe] secret present?", Boolean(secret));
  }
  if (!secret) return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });

  // Use Buffer – safest for Stripe signature check
  const raw = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err: any) {
    console.error("[stripe] bad signature:", err?.message);
    return new Response("Signature verification failed", { status: 400 });
  }

  if (DEBUG) console.log("[stripe] event type:", event.type);

  try {
    switch (event.type) {
      // Checkout completes first
      case "checkout.session.completed": {
        const cs = event.data.object as Stripe.Checkout.Session;
        const userId = (cs.metadata?.userId as string) || "";
        const amountC = Number(cs.amount_total ?? 0);
        const ref = `cs_${cs.id}`;
        await creditOnce(userId, amountC, ref, cs);
        break;
      }

      // PaymentIntent succeeded is a good backup
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const userId = (pi.metadata?.userId as string) || "";
        const amountC = Number(pi.amount_received ?? pi.amount ?? 0);
        const ref = `pi_${pi.id}`;
        await creditOnce(userId, amountC, ref, pi);
        break;
      }

      default:
        // ignore other event types quietly
        break;
    }
  } catch (e) {
    console.error("[stripe] webhook handler error:", e);
    return new Response("handler error", { status: 500 });
  }

  return new Response("ok");
}
