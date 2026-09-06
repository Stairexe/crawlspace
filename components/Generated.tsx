"use client";

import { useState } from "react";
import type { AuditReport } from "@/lib/types";
import { CopyButton } from "./primitives";
import { X } from "lucide-react";

type Kind = "llms.txt" | "jsonld" | "robots";

const TABS: { kind: Kind; label: string; blurb: string }[] = [
  {
    kind: "llms.txt",
    label: "llms.txt",
    blurb:
      "A short context file at your site root. Scored for ChatGPT, Claude and Perplexity only — Google states AI files are not required for AI Overviews.",
  },
  {
    kind: "jsonld",
    label: "JSON-LD",
    blurb:
      "The structured data this page is missing, pre-filled from its own content. Paste it into the <head>.",
  },
  {
    kind: "robots",
    label: "robots.txt",
    blurb:
      "An allow group for every AI crawler that can cite you, plus a block on CCBot — which is training-only, so blocking it costs no citations.",
  },
];

export function Generated({
  report,
  onClose,
}: {
  report: AuditReport;
  onClose?: () => void;
}) {
  const [active, setActive] = useState<Kind>("llms.txt");
  const [cache, setCache] = useState<Partial<Record<Kind, string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(kind: Kind) {
    setActive(kind);
    if (cache[kind]) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, evidence: report.evidence }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not generate that file.");
      setCache((c) => ({ ...c, [kind]: json.content as string }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate that file.");
    } finally {
      setBusy(false);
    }
  }

  const content = cache[active];
  const tab = TABS.find((t) => t.kind === active)!;

  const inner = (
    <div className="card overflow-hidden">
      <div className="mono flex items-center border-b border-line text-[12px] bg-surface/80">
        {TABS.map((t) => (
          <button
            key={t.kind}
            type="button"
            onClick={() => load(t.kind)}
            className={`border-b-2 px-4 py-2.5 transition-colors ${
              active === t.kind
                ? "border-signal text-ink font-bold"
                : "border-transparent text-ink-faint hover:text-ink-dim"
            }`}
          >
            {t.label}
          </button>
        ))}
        {content && (
          <span className="ml-auto flex items-center pr-3">
            <CopyButton text={content} />
          </span>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close generated panel"
            className="mono flex items-center justify-center px-3 py-2 text-ink-faint hover:text-ink ml-2 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="p-5">
        <p className="mb-3 text-[12.5px] leading-relaxed text-ink-faint">{tab.blurb}</p>
        {!content && !busy && (
          <button
            type="button"
            onClick={() => load(active)}
            className="mono rounded-lg bg-signal px-4 py-2 text-[12.5px] font-semibold text-void transition-colors hover:brightness-110"
          >
            Generate {tab.label}
          </button>
        )}
        {busy && <p className="mono text-[12px] text-ink-faint">generating…</p>}
        {error && <p className="text-[12.5px] text-danger">{error}</p>}
        {content && (
          <pre className="thin-scroll max-h-96 overflow-auto rounded-md border border-line bg-base p-3.5 text-[11.5px] leading-relaxed text-ink-dim">
            <code>{content}</code>
          </pre>
        )}
      </div>
    </div>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 p-4 backdrop-blur-md">
        <div className="w-full max-w-2xl">{inner}</div>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-[16px] font-semibold tracking-tight">
        The files this page is missing{" "}
        <span className="mono ml-1 text-[12px] font-normal text-ink-faint">
          generated from its own content · no model used
        </span>
      </h2>
      {inner}
    </section>
  );
}
