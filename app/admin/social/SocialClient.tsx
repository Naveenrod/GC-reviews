"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Send, Plug } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export function SocialClient({
  connected,
  accountId,
  hasAppCreds,
  posts,
}: {
  connected: boolean;
  accountId: string;
  hasAppCreds: boolean;
  posts: any[];
}) {
  const router = useRouter();
  const [igId, setIgId] = useState(accountId);
  const [token, setToken] = useState("");
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function call(payload: object) {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setBusy(false);
    return json;
  }

  async function save() {
    const json = await call({
      action: "save",
      ig_business_account_id: igId,
      ig_access_token: token,
      fb_app_id: appId || undefined,
      fb_app_secret: appSecret || undefined,
    });
    if (json.ok) {
      setMsg({ ok: true, text: "Saved. Run 'Test connection' to confirm." });
      setToken("");
      router.refresh();
    } else {
      setMsg({ ok: false, text: json.error || "Save failed." });
    }
  }

  async function test() {
    const json = await call({ action: "test" });
    setMsg(
      json.ok
        ? { ok: true, text: `Connected as @${json.username} 🎉` }
        : { ok: false, text: json.error || "Connection failed." }
    );
  }

  async function postNow() {
    const json = await call({ action: "post" });
    setMsg(
      json.ok
        ? { ok: true, text: `Posted "${json.venue}" to Instagram!` }
        : { ok: false, text: json.error || "Post failed." }
    );
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-6">
      {/* status */}
      <div
        className={`flex items-center gap-2 rounded-xl border p-4 ${
          connected
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        <Plug size={18} />
        {connected
          ? "Instagram credentials saved. Auto-posting runs daily."
          : "Not connected yet — add your credentials below."}
      </div>

      {/* connect form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Connect Instagram</h2>
        <p className="mt-1 text-sm text-slate-500">
          From your Meta app. See the setup guide if you don&apos;t have these yet.
        </p>
        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">
              Instagram Business Account ID
            </span>
            <input
              value={igId}
              onChange={(e) => setIgId(e.target.value)}
              placeholder="17841400000000000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">
              Long-lived access token
            </span>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={connected ? "•••••• (leave blank to keep current)" : "EAAG..."}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-slate-600">
              Optional: auto-refresh token (App ID + Secret){" "}
              {hasAppCreds && "✓ saved"}
            </summary>
            <div className="mt-2 space-y-2">
              <input
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="Facebook App ID"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <input
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                placeholder="Facebook App Secret"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <p className="text-xs text-slate-400">
                With these, the token auto-refreshes before it expires (every 60
                days). Without them, you&apos;ll re-paste a fresh token every ~2
                months.
              </p>
            </div>
          </details>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={save}
            disabled={busy}
            className="rounded-lg bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={test}
            disabled={busy || !connected}
            className="rounded-lg border border-slate-300 px-5 py-2 font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            Test connection
          </button>
          <button
            onClick={postNow}
            disabled={busy || !connected}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2 font-semibold text-white hover:brightness-95 disabled:opacity-50"
          >
            <Send size={16} /> Post next venue now
          </button>
        </div>
        {msg && (
          <div
            className={`mt-4 flex items-center gap-2 text-sm ${
              msg.ok ? "text-green-700" : "text-red-600"
            }`}
          >
            {msg.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {msg.text}
          </div>
        )}
      </div>

      {/* history */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 font-semibold">Recent posts</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing posted yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {posts.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                {p.status === "posted" ? (
                  <CheckCircle2 size={18} className="shrink-0 text-green-600" />
                ) : (
                  <XCircle size={18} className="shrink-0 text-red-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">
                    {p.venue?.name ?? p.guide_slug ?? "—"}
                  </p>
                  {p.status === "failed" && p.error && (
                    <p className="truncate text-xs text-red-500">{p.error}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-slate-400">
                  {timeAgo(p.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
