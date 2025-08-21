// components/AccountForm.tsx
"use client";
import { useState } from "react";

type Profile = {
  email: string;
  name: string | null;
  telegram: string | null;
  address: string | null;
  createdAt: string;
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
      const j = (await r.json()) as Profile;
      setProfile(j);
      setEditing(false);
      alert("Profile saved");
    } else {
      const j = await r.json().catch(() => ({}));
      alert(j.error || "Failed to save");
    }
  }

  async function changePassword() {
    if (pwd.newPassword !== pwd.confirm) {
      alert("New passwords do not match");
      return;
    }
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
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-zinc-400">Profile</div>
          {!editing ? (
            <button
              onClick={() => {
                setEdit({
                  name: profile.name ?? "",
                  telegram: profile.telegram ?? "",
                  address: profile.address ?? "",
                });
                setEditing(true);
              }}
              className="rounded-lg border border-zinc-800 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
            >
              Edit profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm hover:bg-emerald-500/15 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEdit({
                    name: profile.name ?? "",
                    telegram: profile.telegram ?? "",
                    address: profile.address ?? "",
                  });
                }}
                className="rounded-lg border border-zinc-800 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <Field label="Email">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm">{profile.email}</div>
        </Field>

        <Field label="Name">
          {editing ? (
            <input
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
              value={edit.name}
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            />
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm">
              {profile.name || <span className="text-zinc-500">—</span>}
            </div>
          )}
        </Field>

        <Field label="Telegram">
          {editing ? (
            <input
              placeholder="@yourhandle"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
              value={edit.telegram}
              onChange={(e) => setEdit({ ...edit, telegram: e.target.value })}
            />
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm">
              {profile.telegram || <span className="text-zinc-500">—</span>}
            </div>
          )}
        </Field>

        <Field label="Address">
          {editing ? (
            <textarea
              rows={3}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
              value={edit.address}
              onChange={(e) => setEdit({ ...edit, address: e.target.value })}
            />
          ) : (
            <div className="whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm">
              {profile.address || <span className="text-zinc-500">—</span>}
            </div>
          )}
        </Field>

        <div className="mt-4">
          <button
            onClick={() => setPwdOpen((v) => !v)}
            className="rounded-lg border border-zinc-800 bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
          >
            {pwdOpen ? "Hide password form" : "Change password"}
          </button>
        </div>
      </div>

      {pwdOpen && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="mb-3 text-lg font-medium">Update password</h2>
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
        </div>
      )}
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
