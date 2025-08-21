"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", password: "", name: "", telegram: "", address: "" });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    const j = await r.json();
    if (r.ok) location.href = "/login";
    else alert(j.error || "Registration failed");
  }

  return (
    <div className="mx-auto max-w-md p-6 text-zinc-100">
      <h1 className="mb-4 text-2xl font-semibold">Create account</h1>
      <form onSubmit={submit} className="space-y-3">
        <Input label="Email" type="email" value={form.email} onChange={(v)=>setForm({...form, email:v})} />
        <Input label="Password" type="password" value={form.password} onChange={(v)=>setForm({...form, password:v})} />
        <Input label="Name (optional)" value={form.name} onChange={(v)=>setForm({...form, name:v})} />
        <Input label="Telegram (optional)" placeholder="@yourhandle" value={form.telegram} onChange={(v)=>setForm({...form, telegram:v})} />
        <Input label="Address (optional)" value={form.address} onChange={(v)=>setForm({...form, address:v})} />
        <button disabled={loading} className="mt-2 w-full rounded-lg border border-zinc-800 bg-white/10 px-3 py-2 text-sm hover:bg-white/15">
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
    </div>
  );
}

function Input({ label, type="text", value, onChange, placeholder="" }:{
  label: string; type?: string; value: string; onChange: (v:string)=>void; placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs uppercase tracking-wide text-zinc-400">{label}</div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e)=>onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
      />
    </label>
  );
}
