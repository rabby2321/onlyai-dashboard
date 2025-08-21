import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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
  const raw = await req.text();
  const given = req.headers.get("x-nowpayments-sig") || "";
  const calc = crypto.createHmac("sha512", process.env.NOWPAYMENTS_IPN_SECRET!).update(raw).digest("hex");
  if (!given || given.toLowerCase() !== calc.toLowerCase()) {
    console.error("[nowp] bad signature");
    return new Response("bad sig", { status: 400 });
  }

  const data = JSON.parse(raw);
  const status = String(data.payment_status || data.status || "").toLowerCase();

  // Only credit on final/confirmed
  const ok = ["finished", "confirmed"].includes(status);
  if (!ok) return new Response("ignored", { status: 200 });

  const userId = String(data.order_id ?? "");
  const ref = `nowp_${data.payment_id ?? data.invoice_id ?? data.id}`;

  // Prefer exact USD; fall back to requested price_amount
  const usd = Number(data.actually_paid_in_usd ?? data.price_amount ?? 0);
  const amountC = Math.round(usd * 100);

  try {
    await creditOnce(userId, amountC, ref, data);
  } catch (e) {
    console.error("[nowp] credit error", e);
    return new Response("error", { status: 500 });
  }
  return new Response("ok");
}
