/**
 * The mark: a small crawler — a dome with one eye, antennae and four legs — in the
 * accent colour. Drawn on a 24px grid so it stays crisp at nav and favicon sizes.
 */
export function CrawlspaceMark({ size = 22, className = "" }: { size?: number; className?: string; landing?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 text-signal ${className}`}
    >
      <path d="M4.5 14.5a7.5 7.5 0 0 1 15 0v.75h-15z" fill="currentColor" />
      <circle cx="12" cy="11.6" r="1.9" fill="#fff" />
      <g stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
        <path d="M8.6 7.9 7 4.6M15.4 7.9 17 4.6" />
        <path d="M6.4 15.6 3.6 19.6M10 15.6 9.2 20.4M14 15.6l.8 4.8M17.6 15.6l2.8 4" />
      </g>
    </svg>
  );
}

export function CrawlspaceLogo({
  size = 22,
  className = "",
  showTagline = false,
}: {
  size?: number;
  className?: string;
  showTagline?: boolean;
  landing?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <CrawlspaceMark size={size} />
      <span className="flex flex-col">
        <span className="wordmark text-[18px] leading-none text-ink">Crawlspace</span>
        {showTagline && (
          <span className="mono mt-1.5 text-[10.5px] uppercase tracking-[0.06em] text-ink-faint">
            GEO audits for AI search
          </span>
        )}
      </span>
    </span>
  );
}
