"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { ShiftSenseLogo } from "@/components/brand/logo";
import { ThemeSwitch } from "@/components/theme/theme-switch";

const links = [
  { href: "/#team", label: "Team" },
  { href: "/#service", label: "Service" },
  { href: "/#houses", label: "Houses" },
  { href: "/#week", label: "The week" },
  { href: "/login", label: "Sign in" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="landing-header-enter relative z-20 mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="flex items-center justify-between gap-4">
        <ShiftSenseLogo href="/" size="md" className="min-w-0" tagline="Workforce planning" />
        <nav className="hidden items-center gap-6 text-[11px] uppercase tracking-[0.22em] lg:flex xl:gap-8" aria-label="Primary">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 sm:gap-6">
          <ThemeSwitch />
          <Link
            href="/signup"
            className="hidden border border-current px-3 py-2.5 text-[11px] uppercase tracking-[0.22em] sm:inline-block sm:px-4 sm:py-3"
          >
            Sign up
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-border lg:hidden"
            aria-expanded={open}
            aria-controls="site-mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav
          id="site-mobile-nav"
          className="mt-4 flex flex-col gap-1 border border-border bg-card p-3 lg:hidden"
          aria-label="Mobile"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="min-h-11 px-3 py-2.5 text-[11px] uppercase tracking-[0.22em]"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/signup"
            className="mt-2 min-h-11 border border-current px-3 py-2.5 text-center text-[11px] uppercase tracking-[0.22em]"
            onClick={() => setOpen(false)}
          >
            Sign up
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
