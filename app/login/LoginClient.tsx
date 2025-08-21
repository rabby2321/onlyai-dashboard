// app/login/LoginClient.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const sp = useSearchParams();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false, // we'll navigate manually
        email,
        password,
      });
      if (res?.ok) {
        const next = sp.get("next") || "/shop"; // default destination
        // Force a full document reload so the server layout re-checks session
        window.location.href = next;
      } else {
        alert("Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100">
      <h1 className="mb-4 text-xl font-semibold">Log in</h1>
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2"
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full rounded-md bg-white/10 px-3 py-2 hover:bg-white/15 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>
      <div className="mt-3 text-sm text-zinc-400">
        No account? <a className="text-white underline" href="/register">Create one</a>
      </div>
    </div>
  );
}
