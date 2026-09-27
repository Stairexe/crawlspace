import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developers — API, MCP, CLI and GitHub Action",
  description:
    "Run Crawlspace surveys from code: a JSON API, an MCP server for Claude, Cursor and other agents, a CLI, and a GitHub Action that fails the build below a score.",
  alternates: { canonical: "/developers" },
};

const BASE = "https://crawlspace-geo.vercel.app";
// Flip when the package is on npm; until then the page says how to run it from the repo.
const NPM_PUBLISHED = false;

function Code({ children }: { children: string }) {
  return (
    <pre tabIndex={0} className="mono mt-3 overflow-x-auto rounded-[3px] border border-line bg-surface p-4 text-[12px] leading-relaxed text-ink">
      {children}
    </pre>
  );
}

function Section({ id, mark, title, children }: { id: string; mark: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-signal pt-5">
      <div className="mono text-[11px] uppercase tracking-[0.14em] text-signal">{mark}</div>
      <h2 className="mt-2 text-[clamp(24px,3vw,34px)] leading-tight">{title}</h2>
      <div className="mt-4 space-y-3 text-[14.5px] leading-relaxed text-ink-dim">{children}</div>
    </section>
  );
}

export default function Developers() {
  return (
    <div className="mx-auto max-w-3xl space-y-16 px-5 pb-24 pt-12">
      <header>
        <div className="tb-label">Developers</div>
        <h1 className="mt-2 text-[clamp(34px,5vw,56px)] leading-[1.02]">Surveys from code, agents and CI.</h1>
        <p className="mt-4 text-[15.5px] leading-relaxed text-ink-dim">
          Every way in runs the same engine as the website, with the same SSRF guards and the same
          published weights. None of them needs an API key.
        </p>
      </header>

      <Section id="mcp" mark="01 — MCP" title="Crawlspace as a tool for AI agents">
        <p>
          The MCP server exposes one tool, <code className="mono text-ink">audit_url</code>. It returns
          per-engine scores, gates, the fix-first plan with projected gains, every finding with
          its evidence, and the weakest passages.
        </p>
        <p>Endpoint (Streamable HTTP, stateless):</p>
        <Code>{`${BASE}/api/mcp`}</Code>
        <p>Claude Code:</p>
        <Code>{`claude mcp add --transport http crawlspace ${BASE}/api/mcp`}</Code>
        <p>Cursor and other clients that take a JSON config:</p>
        <Code>{`{
  "mcpServers": {
    "crawlspace": { "url": "${BASE}/api/mcp" }
  }
}`}</Code>
      </Section>

      <Section id="api" mark="02 — API" title="JSON API">
        <p>One page, full report — the same object the website renders:</p>
        <Code>{`curl -X POST ${BASE}/api/audit \\
  -H 'content-type: application/json' \\
  -d '{"url":"https://example.com/pricing"}'`}</Code>
        <p>Pages to survey for a whole site (sitemap sampled across sections, up to 20):</p>
        <Code>{`curl -X POST ${BASE}/api/sitemap \\
  -H 'content-type: application/json' \\
  -d '{"url":"example.com"}'`}</Code>
        <p>
          Errors come back as <code className="mono text-ink">{`{ error, code }`}</code> with a real status
          code. Limits: 12 page surveys per 10 minutes per IP (60 when sent as part of a site survey
          with <code className="mono text-ink">x-crawlspace-mode: site</code>), 4 site plans per 10 minutes.
        </p>
      </Section>

      <Section id="cli" mark="03 — CLI" title="Command line">
        {NPM_PUBLISHED ? (
          <Code>{`npx crawlspace https://example.com/pricing`}</Code>
        ) : (
          <>
            <p>The npm package is not published yet. Run the bundled CLI from the repository:</p>
            <Code>{`git clone https://github.com/Stairexe/crawlspace
node crawlspace/cli/dist/crawlspace.mjs https://example.com/pricing`}</Code>
          </>
        )}
        <Code>{`--format text|json|markdown|sarif   output (default text)
--min-score N                         exit 1 if the composite is below N
--engine-min N                        exit 1 if any engine is below N`}</Code>
        <p>It runs the engine locally — no request goes to crawlspace-geo.vercel.app.</p>
      </Section>

      <Section id="action" mark="04 — GitHub Action" title="Fail the build when citability drops">
        <Code>{`- uses: Stairexe/crawlspace@main
  with:
    url: https://example.com/pricing
    min-score: 60
    # engine-min: 40
    # sarif-file: crawlspace.sarif`}</Code>
        <p>
          The survey is written to the job summary. The step fails when the composite falls below
          <code className="mono text-ink"> min-score</code> or any engine below
          <code className="mono text-ink"> engine-min</code>.
        </p>
      </Section>
    </div>
  );
}
