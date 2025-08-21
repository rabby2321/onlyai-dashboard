import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amountC } = await req.json();
  const allowed = [5000, 10000, 20000]; // $50, $100, $200
  if (!allowed.includes(Number(amountC))) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const base = process.env.NOWPAYMENTS_API_BASE ?? "https://api.nowpayments.io";
  const body = {
    price_amount: Number((Number(amountC) / 100).toFixed(2)),
    price_currency: "USD",
    order_id: userId,                    // we read this back in the IPN
    order_description: "Wallet top-up",
    success_url: `${process.env.NEXTAUTH_URL}/wallet?ok=1`,
    cancel_url: `${process.env.NEXTAUTH_URL}/wallet`,
    ipn_callback_url: `${process.env.NEXTAUTH_URL}/api/wallet/nowp/ipn`,
  };

  const res = await fetch(`${base}/v1/invoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.NOWPAYMENTS_API_KEY!,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("[nowp] create invoice failed:", res.status, txt);
    return NextResponse.json({ error: "NOWPayments error" }, { status: 502 });
  }

  const invoice = await res.json(); // has { id, invoice_url, ... }
  return NextResponse.json({ url: invoice.invoice_url, id: invoice.id });
}
