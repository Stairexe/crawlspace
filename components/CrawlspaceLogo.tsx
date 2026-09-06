import React from "react";

export function CrawlspaceMark({
  size = 32,
  className = "",
  variant = "emerald",
}: {
  size?: number;
  className?: string;
  variant?: "emerald" | "white" | "pine";
}) {
  const outerFill = variant === "white" ? "#FFFFFF" : variant === "pine" ? "#0F5132" : "#3BF48A";
  const innerFill = variant === "emerald" ? "#10B981" : "#3BF48A";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Hexagonal Open "C" Brand Mark */}
      <path
        d="M68 22L40 22L20 50L40 78L68 78L80 62L65 62L56 70L34 70L22 50L34 30L56 30L65 38L80 38L68 22Z"
        fill={outerFill}
      />
      {/* Central Emerald Core Gem */}
      <polygon
        points="50,38 60,44 60,56 50,62 40,56 40,44"
        fill={innerFill}
      />
    </svg>
  );
}

export function CrawlspaceLogo({
  size = 32,
  showTagline = false,
  className = "",
}: {
  size?: number;
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative flex items-center justify-center">
        <CrawlspaceMark size={size} variant="emerald" />
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-signal/20 blur-md pointer-events-none"
        />
      </div>
      <div className="flex flex-col">
        <span className="font-satoshi text-[18px] font-bold tracking-[-0.02em] text-ink flex items-center">
          Crawl<span className="text-signal">Space</span>
        </span>
        {showTagline && (
          <span className="mono text-[9px] uppercase tracking-[0.16em] text-ink-faint">
            Website Visibility • Search • AI
          </span>
        )}
      </div>
    </div>
  );
}
