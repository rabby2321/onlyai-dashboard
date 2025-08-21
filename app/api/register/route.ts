import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const { email, password, name, telegram, address } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Missing email/password" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 409 });

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      hash,
      telegram: telegram || null,
      address: address || null,
      wallet: { create: { balanceC: 0 } },
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
}
