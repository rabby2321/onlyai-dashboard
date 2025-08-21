import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const runtime = "nodejs";

const NOWP_BASE = process.env.NOWPAYMENTS_BASE ?? "https://api.nowpayments.io";
const NOWP_KEY  = process.env.NOWPAYMENTS_API_KEY!;

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

  const success_url = `${process.env.NEXTAUTH_URL}/wallet?ok=1`;
  const cancel_url  = `${process.env.NEXTAUTH_URL}/wallet`;
  const ipn_url     = `${process.env.NEXTAUTH_URL}/api/wallet/nowp/ipn`;

  const body = {
    price_amount: amountC / 100,
    price_currency: "usd",
    order_id: `wallet_${userId}_${Date.now()}`,
    order_description: "Wallet Top-up",
    ipn_callback_url: ipn_url,
    success_url,
    cancel_url,
  };

  const res = await fetch(`${NOWP_BASE}/v1/invoice`, {
    method: "POST",
    headers: { "x-api-key": NOWP_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json({ error: data.message || "NOWPayments error" }, { status: 400 });

  return NextResponse.json({ url: data.invoice_url, id: data.id });
}
