// app/api/shop/buy/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.userId as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { planId } = await req.json();
    if (!planId) return NextResponse.json({ error: "Missing planId" }, { status: 400 });

    // Do everything atomically
    const result = await prisma.$transaction(async (tx) => {
      const plan = await tx.plan.findUnique({ where: { id: planId } });
      if (!plan) throw new Error("PLAN_NOT_FOUND");

      const wallet = await tx.wallet.findUnique({ where: { userId } });
      const balanceC = wallet?.balanceC ?? 0;
      if (balanceC < plan.priceC) throw new Error("INSUFFICIENT_FUNDS");

      // map duration → your specific endpoint
      const TARGETS: Record<number, { host: string; port: number }> = {
        1:  { host: "24.199.107.62", port: 21805 }, // 1 day
        7:  { host: "24.199.107.62", port: 51047 }, // 1 week
        30: { host: "24.199.107.62", port: 56936 }, // 30 days
      };

      let endpoint = null as any;
      const tgt = TARGETS[plan.durationD];
      if (tgt) {
        endpoint = await tx.endpoint.findFirst({
          where: { host: tgt.host, port: tgt.port, status: "FREE" },
        });
      }
      if (!endpoint) {
        // fallback to any free one
        endpoint = await tx.endpoint.findFirst({
          where: { status: "FREE" },
          orderBy: { createdAt: "asc" },
        });
      }
      if (!endpoint) throw new Error("NO_FREE_ENDPOINTS");

      // reserve endpoint
      await tx.endpoint.update({
        where: { id: endpoint.id },
        data: { status: "ASSIGNED" },
      });

      // create allocation
      const alloc = await tx.allocation.create({
        data: {
          userId,
          endpointId: endpoint.id,
          planId: plan.id,
          startsAt: new Date(),
          endsAt: new Date(Date.now() + plan.durationD * 24 * 60 * 60 * 1000),
          active: true,
        },
      });

      // charge wallet & record txn
      await tx.wallet.update({
        where: { userId },
        data: { balanceC: { decrement: plan.priceC } },
      });
      await tx.txn.create({
        data: {
          userId,
          type: "DEBIT",
          amountC: plan.priceC,
          ref: `plan:${plan.id}`,
          meta: { allocationId: alloc.id },
        },
      });

      return { allocId: alloc.id };
    });

    // Success JSON for your client to redirect on
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    if (e?.message === "PLAN_NOT_FOUND")
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    if (e?.message === "INSUFFICIENT_FUNDS")
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    if (e?.message === "NO_FREE_ENDPOINTS")
      return NextResponse.json({ error: "No free endpoints available" }, { status: 409 });

    console.error("[/api/shop/buy] error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
