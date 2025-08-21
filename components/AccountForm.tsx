// components/AccountForm.tsx (CLIENT)
"use client";
import { useState } from "react";
import { Mail, MapPin, Wallet, Send } from "lucide-react";

type Profile = {
  email: string;
  name: string | null;
  telegram: string | null;
  address: string | null;
  createdAt: string;
  balanceC: number;   // cents
};

export default function AccountForm({ initial }: { initial: Profile }) {
  const [profile, setProfile] = useState(initial);
  const [edit, setEdit] = useState({
    name: initial.name ?? "",
    telegram: initial.telegram ?? "",
    address: initial.address ?? "",
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwdSaving, setPwdSaving] = useState(false);

  async function saveProfile() {
    setSaving(true);
    const r = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edit),
    });
    setSaving(false);
    if (r.ok) {
      const j = (await r.json()) as Omit<Profile, "balanceC">;
      setProfile({ ...profile, ...j });
      setEditing(false);
      alert("Profile saved");
    } else {
      const j = await r.json().catch(() => ({}));
      alert(j.error || "Failed to save");
    }
  }

  async function changePassword() {
    if (pwd.newPassword !== pwd.confirm) return alert("New passwords do not match");
    setPwdSaving(true);
    const r = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword }),
    });
    setPwdSaving(false);
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      alert("Password updated");
      setPwd({ currentPassword: "", newPassword: "", confirm: "" });
      setPwdOpen(false);
    } else {
      alert(j.error || "Failed to update password");
    }
  }

  return (
    <div className="space-y-6">
      {/* Personal info card with icons */}
      {!editing && (
        <div className="rounded-xl border border-zinc-800 bg-[#22232a] p-5">
          <div className="mb-4 text-sm text-zinc-400">Personal Information</div>
          <ul className="space-y-6">
            <InfoRow
              icon={<Mail className="size-4" />}
              label="Email"
              value={<a className="text-sky-400 hover:underline" href={`mailto:${profile.email}`}>{profile.email}</a>}
              color="emerald"
            />
            <InfoRow
              icon={<MapPin className="size-4" />}
              label="Address"
              value={<span className="text-zinc-200">{profile.address || "—"}</span>}
              color="indigo"
            />
            <InfoRow
              icon={<Wallet className="size-4" />}
              label="Account Balance"
              value={<span className="text-zinc-200">${(profile.balanceC / 100).toFixed(2)} USD</span>}
              color="lime"
            />
            <InfoRow
              icon={<Send className="size-4" />}
              label="Telegram"
              value={
                profile.telegram ? (
                  <a className="text-sky-400 hover:underline" href={profile.telegram.startsWith("http") ? profile.telegram : `https://t.me/${profile.telegram.replace(/^@/, "")}`} target="_blank">
                    {profile.telegram}
                  </a>
                ) : (
                  <span className="text-zinc-500">—</span>
                )
              }
              color="sky"
            />
          </ul>

          <div className="mt-6">
            <button
              onClick={() => {
                setEdit({
                  name: profile.name ?? "",
                  telegram: profile.telegram ?? "",
                  address: profile.address ?? "",
                });
                setEditing(true);
              }}
              className="rounded-lg border border-zinc-800 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
            >
              Edit profile
            </button>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <Field label="Name">
            <input
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
              value={edit.name}
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            />
          </Field>

          <Field label="Telegram">
            <input
              placeholder="@yourhandle or full t.me link"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
              value={edit.telegram}
              onChange={(e) => setEdit({ ...edit, telegram: e.target.value })}
            />
          </Field>

          <Field label="Address">
            <textarea
              rows={3}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
              value={edit.address}
              onChange={(e) => setEdit({ ...edit, address: e.target.value })}
            />
          </Field>

          <div className="mt-4 flex gap-2">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm hover:bg-emerald-500/15 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-zinc-800 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Password panel */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <h2 className="mb-3 text-lg font-medium">Security</h2>
        {!pwdOpen ? (
          <button
            onClick={() => setPwdOpen(true)}
            className="rounded-lg border border-zinc-800 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
          >
            Change password
          </button>
        ) : (
          <>
            <Field label="Current password">
              <input
                type="password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                value={pwd.currentPassword}
                onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
              />
            </Field>
            <Field label="New password">
              <input
                type="password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                value={pwd.newPassword}
                onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
              />
            </Field>
            <Field label="Confirm new password">
              <input
                type="password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
              />
            </Field>

            <div className="mt-3 flex gap-3">
              <button
                onClick={changePassword}
                disabled={pwdSaving}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm hover:bg-emerald-500/15 disabled:opacity-50"
              >
                {pwdSaving ? "Updating…" : "Update password"}
              </button>
              <button
                onClick={() => {
                  setPwdOpen(false);
                  setPwd({ currentPassword: "", newPassword: "", confirm: "" });
                }}
                className="rounded-lg border border-zinc-800 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <div className="mb-1 text-xs uppercase tracking-wide text-zinc-400">{label}</div>
      {children}
    </label>
  );
}

// Small presentational row with icon badge
function InfoRow({
  icon,
  label,
  value,
  color = "emerald",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color?: "emerald" | "indigo" | "lime" | "sky";
}) {
  const ring =
    color === "emerald"
      ? "ring-emerald-400/30 bg-emerald-500/10"
      : color === "indigo"
      ? "ring-indigo-400/30 bg-indigo-500/10"
      : color === "lime"
      ? "ring-lime-400/30 bg-lime-500/10"
      : "ring-sky-400/30 bg-sky-500/10";
  return (
    <li className="flex items-start gap-4">
      <div className={`flex size-9 items-center justify-center rounded-xl ${ring} ring-1`}>
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-zinc-200">{label}</div>
        <div className="text-sm text-zinc-400">{value}</div>
      </div>
    </li>
  );
}
