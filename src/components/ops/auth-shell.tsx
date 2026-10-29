import Link from "next/link";
import type { ReactNode } from "react";

import { ShiftSenseLogo } from "@/components/brand/logo";
import { ThemeSwitch } from "@/components/theme/theme-switch";

type AuthImage = {
  src: string;
  alt: string;
  label?: string;
};

type AuthShellProps = {
  kicker: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer: { href: string; label: string };
  hero?: AuthImage & { lead?: string };
  gallery?: AuthImage[];
  /** Wider form column for multi-field signup. */
  wide?: boolean;
};

export function AuthShell({
  kicker,
  title,
  description,
  children,
  footer,
  hero,
  gallery,
  wide = false,
}: AuthShellProps) {
  return (
    <div className="min-h-full bg-background">
      <div className="lg:grid lg:min-h-full lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="relative min-h-[44vh] overflow-hidden lg:min-h-full lg:sticky lg:top-0 lg:h-screen">
          {gallery ? (
            <div className="grid h-full min-h-[44vh] grid-rows-3 lg:min-h-full">
              {gallery.map((item) => (
                <div key={item.src} className="relative min-h-[14vh] overflow-hidden lg:min-h-0">
                  <img src={item.src} alt={item.alt} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40" />
                  {item.label ? (
                    <p className="absolute bottom-4 left-6 text-[11px] uppercase tracking-[0.22em] text-[#f4efe6]">
                      {item.label}
                    </p>
                  ) : null}
                </div>
              ))}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-6 py-10 lg:px-12">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#d4bc8a]">Hospitality</p>
                <p className="display mt-3 max-w-md text-4xl leading-none text-[#f4efe6] lg:text-5xl">
                  One roster for every kind of house.
                </p>
              </div>
            </div>
          ) : hero ? (
            <>
              <img src={hero.src} alt={hero.alt} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/25" />
              <div className="relative flex h-full min-h-[44vh] flex-col justify-end px-6 py-12 lg:min-h-full lg:px-12 lg:py-16">
                {hero.label ? (
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#d4bc8a]">{hero.label}</p>
                ) : null}
                {hero.lead ? (
                  <p className="display mt-4 max-w-sm text-5xl leading-[0.95] text-[#f4efe6] lg:text-6xl">{hero.lead}</p>
                ) : null}
              </div>
            </>
          ) : null}
        </div>

        <div
          className={`mx-auto flex w-full flex-col justify-center px-4 py-10 sm:px-6 sm:py-12 lg:max-w-none lg:px-14 lg:py-16 xl:px-20 ${wide ? "max-w-3xl" : "max-w-xl"}`}
        >
          <div className="mb-8 flex items-center justify-between gap-4">
            <ShiftSenseLogo href="/" size="lg" />
            <ThemeSwitch />
          </div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent">{kicker}</p>
          <h1 className="display mt-3 text-4xl leading-[0.92] sm:text-5xl lg:text-6xl">{title}</h1>
          {description ? <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">{description}</p> : null}
          {children}
          <Link href={footer.href} className="mt-8 text-[11px] uppercase tracking-[0.18em]">
            {footer.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
