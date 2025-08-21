import "./globals.css";
import Image from "next/image";
import Link from "next/link";
import SidebarNav from "@/components/shell/SidebarNav";
import AuthButton from "@/components/shell/AuthButton";
import BalancePill from "@/components/shell/BalancePill";
import { Inter } from "next/font/google";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { Send } from "lucide-react"; // <- icon for Telegram button

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: { default: "OnlyAI Proxies", template: "%s • OnlyAI Proxies" },
  description: "Client dashboard",
  icons: { icon: "/onlyai-logo.jpg" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId as string | undefined;

  let balanceC: number | null = null;
  if (userId) {
    const w = await prisma.wallet.findUnique({ where: { userId } });
    balanceC = w?.balanceC ?? 0;
  }

  return (
    <html lang="en" className={"h-full " + inter.className}>
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="grid min-h-screen grid-cols-[260px_1fr]">
          <aside className="border-r border-zinc-800/60 bg-zinc-950/60 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/40">
            <div className="flex items-center gap-3 px-4 py-5">
              <Link href="/shop" prefetch={false} className="group flex items-center gap-3">
                <Image
                  src="/onlyai-logo.jpg"
                  alt="OnlyAI Proxies logo"
                  width={40}
                  height={40}
                  priority
                  className="h-10 w-10 rounded-lg"
                />
                <span className="text-xl font-semibold tracking-wide bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent group-hover:opacity-90">
                  OnlyAI Proxies
                </span>
              </Link>
            </div>
            {/* Pass auth state so Logout tab renders */}
            <SidebarNav authed={Boolean(userId)} />
          </aside>

          <main className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-10 border-b border-zinc-800/60 bg-zinc-950/60 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/40">
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-400">Client Area</div>
                <div className="flex items-center gap-3">
                  {/* Telegram icon button (no text) */}
                  <a
                    href="https://t.me/OnlyAiProxySupport"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Contact support on Telegram @OnlyAiProxySupport"
                    title="@OnlyAiProxySupport"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/15"
                  >
                    <Send size={18} strokeWidth={2} />
                  </a>

                  <BalancePill authed={Boolean(userId)} initial={balanceC ?? undefined} />

                  {/* Hide header auth button when logged in (Logout lives in sidebar) */}
                  {userId ? null : <AuthButton authed={false} />}
                </div>
              </div>
            </header>

            <div className="mx-auto w-full max-w-4xl p-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
