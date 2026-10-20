import Link from "next/link";
import { AsciiField } from "@/components/AsciiField";

export default function NotFound() {
  return (
    <div className="frame relative overflow-hidden border-b border-line">
      <AsciiField shape="orb" accent className="absolute inset-0 h-full w-full opacity-60" />
      <div className="relative mx-auto flex max-w-xl flex-col items-center px-6 py-28 text-center">
        <div className="bracket">
          [ <b>404</b> · not found ]
        </div>
        <h1 className="mt-4 text-[clamp(32px,5vw,52px)]">
          Nothing to crawl <span className="text-signal">here</span>
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-ink-dim">
          The page may have moved, or a shared report may have been switched off by its owner.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          <Link href="/" className="btn-primary">
            Run an audit
          </Link>
          <Link href="/dashboard" className="btn-quiet">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
