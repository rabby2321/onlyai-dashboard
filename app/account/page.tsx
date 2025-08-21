// app/account/page.tsx  (SERVER)
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import AccountForm from "../../components/AccountForm";


export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId;
  if (!userId) redirect("/login");

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, telegram: true, address: true, createdAt: true },
  });
  if (!u) redirect("/login");

  const w = await prisma.wallet.findUnique({ where: { userId } });

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 text-zinc-100">
      <h1 className="text-2xl font-semibold">Account</h1>
      <div className="text-sm text-zinc-400">Created: {new Date(u.createdAt).toLocaleString()}</div>
      <AccountForm
        initial={{
          email: u.email,
          name: u.name ?? null,
          telegram: u.telegram ?? null,
          address: u.address ?? null,
          createdAt: u.createdAt.toISOString(),
          balanceC: w?.balanceC ?? 0,
        }}
      />
    </div>
  );
}
