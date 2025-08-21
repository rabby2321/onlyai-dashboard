// app/order/success/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SuccessActions from "./SuccessActions";
import ConfettiBurst from "./ConfettiBurst";

export default async function OrderSuccess({
  searchParams,
}: {
  // Next 15: searchParams is async and must be awaited
  searchParams: Promise<{ alloc?: string }>;
}) {
  const { alloc } = await searchParams;

  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId as string | undefined;
  if (!userId || !alloc) redirect("/my/proxy");

  const allocation = await prisma.allocation.findFirst({
    where: { id: alloc, userId },
    include: { endpoint: true, plan: true },
  });
  if (!allocation) redirect("/my/proxy");

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  const balanceC = wallet?.balanceC ?? 0;

  const ep = allocation.endpoint!;
  const plan = allocation.plan!;
  const proxyString = `${ep.authUser}:${ep.authPass}@${ep.host}:${ep.port}`;

  return (
    <div className="mx-auto max-w-2xl p-6 text-zinc-100">
      <div className="relative rounded-2xl border border-green-700/40 bg-green-950/20 p-6">
        {/* 🎉 confetti draws above this card */}
        <ConfettiBurst />

        {/* Checkmark */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-600/20 ring-1 ring-green-500/40">
          <svg width="24" height="24" viewBox="0 0 24 24" className="text-green-400">
            <path
              fill="currentColor"
              d="M9 16.2 4.8 12l-1.4 1.4L9 19.0 21 7l-1.4-1.4z"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-center text-2xl font-semibold text-white">
          Order confirmed
        </h1>
        <p className="mb-6 text-center text-sm text-zinc-300">
          Your proxy is ready. We also recorded the payment and updated your balance.
        </p>

        {/* Summary */}
        <div className="grid gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <Row label="Plan">{plan?.name ?? "5G Mobile Proxy"}</Row>
          <Row label="Duration">{plan?.durationD ?? 30} days</Row>
          <Row label="Endpoint">
            {ep.host}:{ep.port}
          </Row>
          <Row label="Auth user">{ep.authUser}</Row>
          <Row label="Auth pass">{ep.authPass}</Row>
          <Row label="Formatted">
            <code className="rounded bg-black/30 px-2 py-1 text-xs">{proxyString}</code>
          </Row>
          <Row label="Remaining balance">
            <span className="font-medium text-white">${(balanceC / 100).toFixed(2)}</span>
          </Row>
        </div>

        {/* Client-side buttons (copy, navigation) */}
        <SuccessActions proxyString={proxyString} />
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-3 text-sm">
      <div className="text-zinc-400">{label}</div>
      <div className="text-zinc-100">{children}</div>
    </div>
  );
}
