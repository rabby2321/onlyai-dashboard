"use client";
import { signOut } from "next-auth/react";

export default function AuthButton({ authed }: { authed: boolean }) {
  if (!authed) {
    return (
      <a href="/login" className="rounded-md border border-zinc-800 px-3 py-1 text-sm hover:bg-zinc-900">
        Log in
      </a>
    );
  }
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-md border border-zinc-800 px-3 py-1 text-sm hover:bg-zinc-900"
    >
      Log out
    </button>
  );
}
