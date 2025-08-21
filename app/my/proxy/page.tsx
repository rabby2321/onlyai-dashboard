// app/my/proxy/page.tsx
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import ProxyCard from "@/components/proxy/ProxyCard";


export const dynamic = "force-dynamic";

export default async function MyProxiesPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId;
  if (!userId) redirect("/login?next=/my/proxy");

  const allocations = await prisma.allocation.findMany({
    where: { userId },
    include: { endpoint: true, plan: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-6xl">
      <h1 className="mb-6 text-2xl font-semibold text-white">My Proxies</h1>

      {allocations.length === 0 ? (
        <Empty />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">  {/* was sm:2 xl:3 */}
  {allocations.map((a) => (
    <ProxyCard
      key={a.id}
      planName={a.plan.name}
      days={a.plan.durationD}
      host={a.endpoint.host}
      port={a.endpoint.port}
      username={a.endpoint.authUser}
      password={a.endpoint.authPass}
      endsAt={a.endsAt}
    />
  ))}
</div>
      )}
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-300">
      You don’t have any active proxies yet.
      <a
        href="/shop"
        className="ml-3 inline-flex items-center rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-sm font-medium text-amber-200 hover:bg-amber-400/20"
      >
        Go to Shop
      </a>
    </div>
  );
}
