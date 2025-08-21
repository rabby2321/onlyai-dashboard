// app/shop/page.tsx
import PricingCard from "@/components/PricingCard";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

// The plans we want to exist
const DEFAULT_PLANS = [
  { name: "5G Mobile Proxy — 1 Day",  priceC:  600,  durationD: 1 },
  { name: "5G Mobile Proxy — 1 Week", priceC: 2500, durationD: 7 },
  { name: "5G Mobile Proxy — 30 Days", priceC: 8000, durationD: 30 },
];

type Meta = {
  displayName?: string;
  tag?: string;
  features: Array<{ label: string; ok: boolean }>;
};

// Create or normalize by duration (idempotent, avoids dupes)
async function ensureDefaultPlans() {
  await Promise.all(
    DEFAULT_PLANS.map(async (p) => {
      const existing = await prisma.plan.findFirst({
        where: { durationD: p.durationD },
      });
      if (!existing) {
        await prisma.plan.create({ data: p });
      } else if (existing.name !== p.name || existing.priceC !== p.priceC) {
        await prisma.plan.update({
          where: { id: existing.id },
          data: { name: p.name, priceC: p.priceC },
        });
      }
    })
  );
}

export default async function ShopPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId as string | undefined;

  // Make sure required plans exist/are normalized
  await ensureDefaultPlans();

  const [plansRaw, wallet] = await Promise.all([
    prisma.plan.findMany(),
    userId ? prisma.wallet.findUnique({ where: { userId } }) : null,
  ]);

  // De-dupe by duration in case any old rows remain, prefer lowest price
  const byDuration = new Map<number, (typeof plansRaw)[number]>();
  for (const pl of plansRaw) {
    const prev = byDuration.get(pl.durationD);
    if (!prev || pl.priceC < prev.priceC) byDuration.set(pl.durationD, pl);
  }
  const plans = Array.from(byDuration.values()).sort(
    (a, b) => a.durationD - b.durationD || a.priceC - b.priceC
  );

  const balanceC = wallet?.balanceC ?? 0;

  // Same metadata for all plans
  const metaFor = (_p: { name: string }): Meta => ({
    displayName: "5G Mobile Proxy",
    tag: "Up To 80–143 Mbps",
    features: [
      { label: "Unlimited rotation", ok: true },
      { label: "HTTPS & SOCKS5", ok: true },
      { label: "US, LA endpoints", ok: true },
      { label: "24/7 support", ok: true },
    ],
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Choose your plan</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Transparent pricing. Instant provisioning. Balance:{" "}
          <span className="font-medium text-white">
            ${(balanceC / 100).toFixed(2)}
          </span>
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <PricingCard
            key={p.id}
            plan={{
              id: p.id,
              name: p.name,
              priceC: p.priceC,
              durationD: p.durationD,
            }}
            meta={metaFor(p)}
            balanceC={balanceC}
          />
        ))}
      </div>
    </div>
  );
}
