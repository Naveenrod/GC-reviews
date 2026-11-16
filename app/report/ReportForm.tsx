"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReportReason, ReportRelationship } from "@/lib/types";

const REASONS: { value: ReportReason; label: string; hint: string }[] = [
  {
    value: "defamation",
    label: "False or defamatory statements",
    hint: "The review makes untrue factual claims that damage a person or business.",
  },
  { value: "fake", label: "Fake or not a genuine visit", hint: "The reviewer did not visit, or is a duplicate or bought review." },
  { value: "conflict", label: "Undisclosed conflict or incentive", hint: "Written by the venue, staff, a competitor, or in exchange for a benefit." },
  { value: "privacy", label: "Private information", hint: "Reveals someone's full name, contact details, health or other private details." },
  { value: "abuse", label: "Abuse, threats or discrimination", hint: "Harassment, hate speech, threats or sexual content." },
  { value: "other", label: "Something else", hint: "Spam, wrong venue, advertising, or another breach of the policy." },
];

const RELATIONSHIPS: { value: ReportRelationship; label: string }[] = [
  { value: "venue_owner", label: "I own or manage this venue" },
  { value: "subject", label: "I am named or described in the review" },
  { value: "member", label: "I am a GC Reviews member" },
  { value: "other", label: "Other" },
];

export function ReportForm({
  reviewId,
  defaultName,
  defaultEmail,
}: {
  reviewId: string | null;
  defaultName: string;
  defaultEmail: string;
}) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [relationship, setRelationship] = useState<ReportRelationship>("other");
  const [reason, setReason] = useState<ReportReason>("defamation");
  const [details, setDetails] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [website, setWebsite] = useState(""); // honeypot: humans never see this field
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ id: string; dueAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewId,
        name,
        email,
        relationship,
        reason,
        details,
        pageUrl: pageUrl || (typeof window !== "undefined" ? document.referrer : ""),
        website,
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Something went wrong. Please try again.");
      return;
    }
    setDone({ id: json.id, dueAt: json.dueAt });
  }

  if (done) {
    const due = new Date(done.dueAt).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return (
      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-lg font-semibold text-emerald-900">Report received</h2>
        <p className="mt-2 text-sm text-emerald-900">
          Your reference is <span className="font-mono">{done.id.slice(0, 8)}</span>. We have
          logged the time of your report and will respond by email. We aim to make a decision by{" "}
          {due}.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-emerald-800 underline">
          Back to home
        </Link>
      </div>
    );
  }

  const inputCls =
    "mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-brand";

  return (
    <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
      {!reviewId && (
        <label className="block text-sm font-medium text-slate-700">
          Link to the page with the review
          <input
            type="url"
            required
            value={pageUrl}
            onChange={(e) => setPageUrl(e.target.value)}
            placeholder="https://"
            className={inputCls}
          />
        </label>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Your name
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Your email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Your connection to this review
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value as ReportRelationship)}
          className={inputCls}
        >
          {RELATIONSHIPS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Why are you reporting it?</legend>
        <div className="mt-2 space-y-2">
          {REASONS.map((r) => (
            <label
              key={r.value}
              className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm ${
                reason === r.value ? "border-brand bg-brand/5" : "border-slate-200"
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-slate-800">{r.label}</span>
                <span className="block text-slate-500">{r.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm font-medium text-slate-700">
        Details
        <textarea
          required
          minLength={20}
          rows={5}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={
            reason === "defamation"
              ? "Quote the specific statements you say are untrue and explain why. Attach nothing here; we will email you if we need evidence."
              : "Tell us what is wrong with the review and anything that helps us check."
          }
          className={inputCls}
        />
      </label>

      {/* Honeypot. Hidden from people, filled by bots. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <p className="text-xs text-slate-500">
        We use your details only to handle this report and may share the substance of your
        complaint, but not your contact details, with the reviewer so they can respond. Knowingly
        false reports may lead to your account being closed.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-brand px-6 py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
      >
        {busy ? "Sending…" : "Submit report"}
      </button>
    </form>
  );
}
