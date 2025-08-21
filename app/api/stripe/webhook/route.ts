// app/api/stripe/webhook/route.ts
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function creditOnce(userId: string, amountC: number, ref: string, meta: any) {
  if (!userId || !amountC || !ref) {
    console.log("[stripe] SKIP creditOnce missing", { userId, amountC, ref });
    return;
  }
  const existing = await prisma.txn.findFirst({ where: { ref } });
  if (existing) {
    console.log("[stripe] DUPLICATE ref, skipping", ref);
    return;
  }
  await prisma.$transaction(async (tx) => {
    await tx.wallet.upsert({
      // Wallet.userId must be UNIQUE or ID for upsert to work
      where: { userId },
      create: { userId, balanceC: amountC },
      update: { balanceC: { increment: amountC } }
    });
    await tx.txn.create({ data: { userId, type: "CREDIT", amountC, ref, meta } });
  });
  console.log("[stripe] CREDIT OK", { userId, amountC, ref });
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e: any) {
    console.error("[stripe] Bad signature:", e.message);
    return new Response("Bad signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const sess = await stripe.checkout.sessions.retrieve(s.id);
        const ref = String(sess.payment_intent || sess.id);
        let userId = (sess.metadata?.userId as string) || "";
        let amountC = (sess.amount_total ?? 0) as number;

        if ((!userId || !amountC) && sess.payment_intent) {
          const pi = await stripe.paymentIntents.retrieve(String(sess.payment_intent));
          userId = (pi.metadata?.userId as string) || userId;
          amountC = (pi.amount_received ?? pi.amount ?? amountC) as number;
        }

        console.log("[stripe] event checkout.session.completed", { userId, amountC, ref });
        if (sess.payment_status === "paid") {
          await creditOnce(userId, amountC, ref, sess);
        } else {
          console.log("[stripe] session not paid, skipping credit");
        }
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const userId = (pi.metadata?.userId as string) || "";
        const amountC = (pi.amount_received ?? pi.amount ?? 0) as number;
        const ref = String(pi.id);
        console.log("[stripe] event payment_intent.succeeded", { userId, amountC, ref });
        await creditOnce(userId, amountC, ref, pi);
        break;
      }

      default:
        break;
    }
  } catch (e) {
    console.error("[stripe] handler error:", e);
    return new Response("handler error", { status: 500 });
  }

  return new Response("ok");
}
