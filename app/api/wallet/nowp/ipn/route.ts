// app/api/wallet/nowp/ipn/route.ts
import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    await tx.txn.create({
      data: { userId, type: "CREDIT", amountC, ref, meta },
    });
  });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();

  // Verify signature
  const sig = req.headers.get("x-nowpayments-sig") || "";
  const expected = crypto
    .createHmac("sha512", process.env.NOWPAYMENTS_IPN_SECRET!)
    .update(raw)
    .digest("hex");

  if (sig.toLowerCase() !== expected.toLowerCase()) {
    console.error("[nowp] bad signature");
    return new Response("bad sig", { status: 400 });
  }

  const j = JSON.parse(raw);
  const status = String(j.payment_status || "").toLowerCase();

  // Consider finished/confirmed as paid
  const ok = status === "finished" || status === "confirmed";
  if (!ok) return new Response("ignored", { status: 200 });

  const amountC = Math.round(Number(j.price_amount) * 100);
  const orderId = String(j.order_id || "");
  // order_id = wallet_<userId>_<ts>
  const userId = orderId.startsWith("wallet_") ? orderId.split("_")[1] : "";
  const ref = `nowp_${j.payment_id || j.invoice_id || j.id}`;

  try {
    await creditOnce(userId, amountC, ref, j);
  } catch (e) {
    console.error("[nowp] credit error", e);
    return new Response("error", { status: 500 });
  }

  return new Response("ok");
}
