"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function LogoutPage() {
  useEffect(() => {
    // Kick off NextAuth signout then send user to /login
    signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <div className="p-6 text-zinc-200">
      Signing you out…
    </div>
  );
}
