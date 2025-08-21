"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard, ShoppingCart, Server, HelpCircle, User, LogOut, LogIn, UserPlus
} from "lucide-react";

type Props = { authed?: boolean };

export default function SidebarNav({ authed = false }: Props) {
  const pathname = usePathname();

  // 👉 Shop is now first, Wallet second
  const itemsPrivate = [
    { href: "/shop",     label: "Shop",       Icon: ShoppingCart },
    { href: "/wallet",   label: "Wallet",     Icon: CreditCard },
    { href: "/my/proxy", label: "My Proxies", Icon: Server },
    { href: "/faq",      label: "FAQ",        Icon: HelpCircle },
    { href: "/account",  label: "Account",    Icon: User },
  ];

  const itemsPublic = [
    { href: "/login",    label: "Log in",     Icon: LogIn },
    { href: "/register", label: "Register",   Icon: UserPlus },
    { href: "/faq",      label: "FAQ",        Icon: HelpCircle },
  ];

  const list = authed ? itemsPrivate : itemsPublic;

  return (
    <nav className="px-2 py-2">
      <ul className="space-y-1">
        {list.map(({ href, label, Icon }) => {
          const active =
            pathname === href ||
            (href !== "/" && pathname.startsWith(href + "/"));
          return (
            <li key={href}>
              <Link
                href={href}
                className={[
                  "group flex items-center gap-3 rounded-lg px-3 py-3",
                  "text-base font-medium",
                  active
                    ? "bg-white/10 text-white"
                    : "text-zinc-300 hover:bg-white/5 hover:text-white",
                ].join(" ")}
              >
                <Icon size={20} className="shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}

        {authed && (
          <>
            <li><div className="my-2 h-px bg-zinc-800/60" /></li>
            <li>
              <Link
                href="/logout"
                className="group flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-zinc-300 hover:bg-white/5 hover:text-white"
              >
                <LogOut size={20} className="shrink-0" />
                <span className="truncate">Log out</span>
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
