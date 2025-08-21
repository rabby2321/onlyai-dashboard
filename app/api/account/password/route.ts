import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();

  if (typeof currentPassword !== "string" || typeof newPassword !== "string")
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (newPassword.length < 8)
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const u = await prisma.user.findUnique({ where: { id: userId }, select: { hash: true } });
  if (!u?.hash) return NextResponse.json({ error: "Password login not enabled for this account" }, { status: 400 });

  const ok = await bcrypt.compare(currentPassword, u.hash);
  if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { hash: newHash } });
  return NextResponse.json({ ok: true });
}
