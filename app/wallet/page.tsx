// app/wallet/page.tsx (SERVER)
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import WalletClient from "./WalletClient";

export default async function WalletPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId;
  if (!userId) redirect("/login");

  return <WalletClient />;
}
