"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PublicUser } from "@/lib/types";
import { refreshSession, signOut } from "./useSession";

function Row({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-b border-line px-6 py-8 md:grid-cols-[1fr_1.4fr] md:px-10">
      <div>
        <h2 className="text-[17px]">{title}</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-dim">{note}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

function useAction() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function run(fn: () => Promise<Response>, okText: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fn();
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "That did not work. Try again.");
      setMsg({ ok: true, text: okText });
      return true;
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "That did not work." });
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, msg, run };
}

function Note({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p role={msg.ok ? "status" : "alert"} className={`mt-3 text-[13.5px] ${msg.ok ? "text-good" : "text-danger"}`}>
      {msg.text}
    </p>
  );
}

export function AccountPanel({ user, audits, shared }: { user: PublicUser; audits: number; shared: number }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const profile = useAction();
  const password = useAction();
  const danger = useAction();

  const json = (method: string, body: unknown) =>
    fetch("/api/account", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

  return (
    <div className="frame mt-0 border-b border-line">
      <header className="border-b border-line px-6 py-12 md:px-10">
        <div className="bracket">
          [ <b>account</b> ]
        </div>
        <h1 className="mt-3 text-[clamp(30px,4vw,44px)]">{user.name}</h1>
        <p className="mt-1 text-[15px] text-ink-dim">{user.email}</p>
        <div className="mt-8 grid max-w-xl grid-cols-3 overflow-hidden rounded-xl border border-line bg-surface">
          {[
            ["Saved audits", String(audits)],
            ["Share links", String(shared)],
            ["Member since", new Date(user.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })],
          ].map(([k, v], i) => (
            <div key={k} className={`px-4 py-3 ${i ? "border-l border-line" : ""}`}>
              <div className="tb-label">{k}</div>
              <div className="num mt-1 text-[20px] text-ink">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/dashboard?tab=history" className="btn-primary">
            Open history
          </Link>
          <button
            type="button"
            className="btn-quiet"
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <Row title="Profile" note="The name shown in your account menu and on reports you share.">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (await profile.run(() => json("PATCH", { name }), "Saved.")) await refreshSession();
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label htmlFor="acc-name" className="field-label">
              Name
            </label>
            <input id="acc-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>
          <button type="submit" disabled={profile.busy} className="btn-quiet">
            {profile.busy ? "Saving…" : "Save"}
          </button>
        </form>
        <Note msg={profile.msg} />
      </Row>

      <Row title="Password" note="Changing it signs out every other device.">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (await password.run(() => json("PATCH", { currentPassword: current, newPassword: next }), "Password changed.")) {
              setCurrent("");
              setNext("");
            }
          }}
          className="space-y-3"
        >
          <div>
            <label htmlFor="acc-cur" className="field-label">
              Current password
            </label>
            <input
              id="acc-cur"
              type="password"
              autoComplete="current-password"
              className="field"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="acc-new" className="field-label">
              New password
            </label>
            <input
              id="acc-new"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="field"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={password.busy} className="btn-quiet">
            {password.busy ? "Changing…" : "Change password"}
          </button>
        </form>
        <Note msg={password.msg} />
      </Row>

      <Row title="Rewrite key" note="Optional. Only used to rewrite weak passages; audits never need it.">
        <p className="text-[14px] leading-relaxed text-ink-dim">
          Your Anthropic or OpenAI key is never stored on your account. Add it on the home page; it stays in
          that browser tab and is sent only with rewrite requests.
        </p>
      </Row>

      <Row title="Delete account" note="Removes your account, every saved audit and every share link. This cannot be undone.">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!window.confirm("Delete your account and all saved audits? This cannot be undone.")) return;
            if (await danger.run(() => json("DELETE", { password: confirmPw }), "Account deleted.")) {
              await refreshSession();
              router.push("/");
            }
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label htmlFor="acc-del" className="field-label">
              Confirm with your password
            </label>
            <input
              id="acc-del"
              type="password"
              autoComplete="current-password"
              className="field"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={danger.busy} className="btn-primary !bg-danger">
            {danger.busy ? "Deleting…" : "Delete account"}
          </button>
        </form>
        <Note msg={danger.msg} />
      </Row>
    </div>
  );
}
