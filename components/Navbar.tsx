"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, User, X } from "lucide-react";
import { GitHubIcon } from "./SocialIcons";
import { CrawlspaceLogo } from "./CrawlspaceLogo";
import { signOut, useSession } from "./useSession";

const PRODUCT = [
  { href: "/", label: "Page audit", note: "Five engine scores for one URL" },
  { href: "/site", label: "Site survey", note: "Up to 20 pages from your sitemap" },
  { href: "/logs", label: "Crawler logs", note: "Which AI bots actually visit" },
  { href: "/compare", label: "Compare", note: "Two audits, side by side" },
];

const LINKS = [
  { href: "/tools", label: "Tools" },
  { href: "/developers", label: "Developers" },
  { href: "/methodology", label: "Methodology" },
  { href: "/sample", label: "Sample report" },
];

const HIDDEN = ["/dashboard", "/report/", "/audit/", "/login", "/signup"];

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "·"
  );
}

export function Navbar() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const productRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    setProduct(false);
    setMenu(false);
  }, [pathname]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
      if (productRef.current && !productRef.current.contains(e.target as Node)) setProduct(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        setProduct(false);
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (HIDDEN.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p || pathname.startsWith(p + "/")))) {
    return null;
  }

  const user = session.user;

  return (
    <>
      {pathname === "/" && !session.loading && session.accounts && (
        <div className="px-3 pt-3">
          <Link
            href={user ? "/dashboard?tab=history" : "/signup"}
            className="mx-auto flex max-w-[1112px] items-center justify-center gap-1 rounded-[10px] bg-signal px-4 py-2 text-center text-[13px] text-white shadow-[var(--btn-shadow)] transition-colors hover:bg-signal-dim"
          >
            <span className="opacity-90">New: accounts with saved history and share links.</span>
            <span className="font-medium underline underline-offset-2">
              {user ? "Open your history" : "Create a free account"} →
            </span>
          </Link>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-line bg-void/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1112px] items-center justify-between px-5">
          <Link href="/" aria-label="Crawlspace home" className="-ml-1 rounded-md p-1">
            <CrawlspaceLogo />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 text-[14px] text-ink-dim md:flex">
            <div ref={productRef} className="relative">
              <button
                type="button"
                onClick={() => setProduct((v) => !v)}
                aria-expanded={product}
                className="nav-link inline-flex items-center gap-1"
              >
                Product <ChevronDown className={`h-3.5 w-3.5 transition-transform ${product ? "rotate-180" : ""}`} />
              </button>
              {product && (
                <div className="absolute left-1/2 top-full mt-2 w-[320px] -translate-x-1/2 rounded-2xl border border-line bg-surface p-2 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.25)] spawn">
                  {PRODUCT.map((p) => (
                    <Link key={p.href} href={p.href} className="block rounded-xl px-3 py-2.5 hover:bg-void">
                      <div className="text-[14px] font-medium text-ink">{p.label}</div>
                      <div className="text-[12.5px] text-ink-faint">{p.note}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link ${pathname === l.href ? "text-ink" : ""}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href="https://github.com/Stairexe/crawlspace"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
              aria-label="Crawlspace on GitHub"
            >
              <GitHubIcon className="h-4 w-4" />
            </a>
            {session.loading ? (
              <span className="h-9 w-[150px]" aria-hidden />
            ) : user ? (
              <>
                <Link href="/dashboard" className="btn-quiet">
                  Dashboard
                </Link>
                <div ref={menuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setMenu((v) => !v)}
                    aria-expanded={menu}
                    aria-label="Account menu"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-white"
                  >
                    {initials(user.name)}
                  </button>
                  {menu && (
                    <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-line bg-surface p-2 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.25)] spawn">
                      <div className="px-3 py-2">
                        <div className="truncate text-[14px] font-medium text-ink">{user.name}</div>
                        <div className="truncate text-[12.5px] text-ink-faint">{user.email}</div>
                      </div>
                      <div className="my-1 h-px bg-line" />
                      <Link href="/account" className="flex items-center gap-2 rounded-xl px-3 py-2 text-[14px] text-ink hover:bg-void">
                        <User className="h-4 w-4 text-ink-faint" /> Account
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          await signOut();
                          router.push("/");
                          router.refresh();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[14px] text-ink hover:bg-void"
                      >
                        <LogOut className="h-4 w-4 text-ink-faint" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost">
                  Log in
                </Link>
                <Link href="/signup" className="btn-quiet">
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-line bg-surface text-ink md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {open && (
          <nav id="mobile-nav" aria-label="Primary" className="border-t border-line bg-surface px-5 pb-6 pt-2 md:hidden">
            <ul className="divide-y divide-line">
              {[...PRODUCT, ...LINKS, { href: "/dashboard", label: "Dashboard" }].map((l, i) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="flex items-baseline gap-4 py-3.5 text-[15px] text-ink">
                    <span className="mono w-6 text-[11px] text-signal">{String(i + 1).padStart(2, "0")}</span>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {user ? (
                <>
                  <Link href="/account" className="btn-quiet">
                    Account
                  </Link>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={async () => {
                      await signOut();
                      router.push("/");
                    }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-quiet">
                    Log in
                  </Link>
                  <Link href="/signup" className="btn-primary">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
