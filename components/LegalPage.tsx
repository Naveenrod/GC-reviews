import type { ReactNode } from "react";
import { POLICIES_UPDATED } from "@/lib/site";

// Shared shell for Terms, Privacy and Review Policy pages.
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-slate-400">Last updated {POLICIES_UPDATED}</p>
      {intro && <p className="mt-4 text-lg leading-relaxed text-slate-600">{intro}</p>}
      <div className="legal mt-8 space-y-8 leading-relaxed text-slate-700">{children}</div>
    </article>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-bold text-slate-900">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function Ul({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-6">{children}</ul>;
}
