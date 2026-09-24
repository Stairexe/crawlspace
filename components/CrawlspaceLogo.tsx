import { CrawlBot } from "./CrawlBot";

/**
 * The mark is the inspector itself, drawn heavier. In the nav it carries
 * data-logo-mark: that is where the Descent's crawl-bot lands.
 */
export function CrawlspaceMark({
  size = 32,
  className = "",
  landing = false,
}: {
  size?: number;
  className?: string;
  /** Set on the one mark the Descent flies into (the nav). */
  landing?: boolean;
}) {
  return (
    <span
      data-logo-mark={landing ? "" : undefined}
      className={`inline-block shrink-0 text-signal transition-opacity duration-200 ${className}`}
      style={{ width: size }}
    >
      <CrawlBot detail="mark" className="block h-auto w-full" />
    </span>
  );
}

export function CrawlspaceLogo({
  size = 32,
  showTagline = false,
  className = "",
  landing = false,
}: {
  size?: number;
  showTagline?: boolean;
  className?: string;
  landing?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <CrawlspaceMark size={size} landing={landing} />
      <span className="flex flex-col">
        <span className="wordmark text-[17px] leading-none text-ink">Crawlspace</span>
        {showTagline && (
          <span className="mono mt-1 text-[9.5px] uppercase tracking-[0.14em] text-ink-faint">
            Structural survey for AI search
          </span>
        )}
      </span>
    </span>
  );
}
