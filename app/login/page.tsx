// app/login/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId;

  // If already signed in, go to ?next or /shop
  if (userId) redirect(searchParams?.next || "/shop");

  return <LoginClient />;
}
