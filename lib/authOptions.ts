import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: String(creds.email).toLowerCase() } });
        if (!user?.hash) return null;
        const ok = await bcrypt.compare(String(creds.password), user.hash);
        return ok ? { id: user.id, email: user.email, name: user.name, role: user.role } as any : null;
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = (user as any).id;
        (token as any).role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).userId = token.sub;
      (session.user as any).role = (token as any).role;
      return session;
    }
  }
};
