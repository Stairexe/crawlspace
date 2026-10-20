"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export interface CodeTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  code: string;
}

/** Firecrawl-style code panel: language tabs, a copy button and an output pane. */
export function CodeTabs({ tabs, output, outputLabel = "JSON" }: { tabs: CodeTab[]; output: string; outputLabel?: string }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const [copied, setCopied] = useState(false);
  const tab = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-line px-2 py-2">
        <div role="tablist" aria-label="Language" className="flex min-w-0 gap-1 overflow-x-auto thin-scroll">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={t.id === tab.id}
              onClick={() => setActive(t.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
                t.id === tab.id ? "bg-void text-ink shadow-[inset_0_0_0_1px_var(--color-line)]" : "text-ink-faint hover:text-ink"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(tab.code).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            });
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] text-ink-dim hover:bg-void hover:text-ink"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-good" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>
      <div className="grid lg:grid-cols-2">
        <pre
          tabIndex={0}
          className="code thin-scroll min-h-[260px] overflow-x-auto border-b border-line p-5 lg:border-b-0 lg:border-r"
        >
          {tab.code.split("\n").map((line, i) => (
            <div key={i} className="flex gap-5">
              <span className="w-4 shrink-0 select-none text-right text-ink-faint/50">{i + 1}</span>
              <span className={line.trim().startsWith("#") || line.trim().startsWith("//") ? "c" : undefined}>
                {line || " "}
              </span>
            </div>
          ))}
        </pre>
        <div className="relative bg-void/60">
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <span className="dots" aria-hidden>
              <i />
              <i />
              <i />
            </span>
            <span className="mono text-[11px] text-ink-faint">[ .{outputLabel} ]</span>
          </div>
          <pre tabIndex={0} className="code thin-scroll max-h-[320px] overflow-auto p-5 text-[12.5px]">
            {output.split("\n").map((line, i) => {
              const m = line.match(/^(\s*)("[^"]+")(:\s*)(.*)$/);
              return (
                <div key={i} className="flex gap-5">
                  <span className="w-4 shrink-0 select-none text-right text-ink-faint/50">{i + 1}</span>
                  {m ? (
                    <span>
                      {m[1]}
                      <span className="k">{m[2]}</span>
                      {m[3]}
                      <span className={/^"/.test(m[4]) ? "s" : "n"}>{m[4]}</span>
                    </span>
                  ) : (
                    <span>{line || " "}</span>
                  )}
                </div>
              );
            })}
          </pre>
        </div>
      </div>
    </div>
  );
}
