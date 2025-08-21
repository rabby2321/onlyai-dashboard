// app/api/stripe/webhook/route.ts
import Stripe from "stripe";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20", // stable
});

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

  if (!secret) {
    console.error("[stripe] Missing STRIPE_WEBHOOK_SECRET");
    return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });
  }

  // Raw body is required for signature verification
  const raw = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err: any) {
    console.error("[stripe] Signature verification failed:", err?.message);
    if (DEBUG) console.error("[stripe] header sig:", sig);
    return new Response("Signature verification failed", { status: 400 });
  }

  if (DEBUG) console.log("[stripe] event", event.id, event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const cs = event.data.object as Stripe.Checkout.Session;
        const userId = (cs.metadata?.userId as string) || "";
        const amountC = Number(cs.amount_total ?? 0);
        if (amountC > 0 && userId) {
          await creditOnce(userId, amountC, `cs_${cs.id}`, cs);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const userId = (pi.metadata?.userId as string) || "";
        const amountC = Number(pi.amount_received ?? pi.amount ?? 0);
        if (amountC > 0 && userId) {
          await creditOnce(userId, amountC, `pi_${pi.id}`, pi);
        }
        break;
      }

      default:
        // ignore everything else
        break;
    }
  } catch (e) {
    console.error("[stripe] webhook handler error for", event.id, e);
    return new Response("handler error", { status: 500 });
  }

  return new Response("ok");
}
