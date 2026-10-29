"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function LandingHero() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReady(true);
      return;
    }
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <section className="relative min-h-[88vh] overflow-hidden text-[#f4efe6]">
      <img
        src="/landing/dining-room.jpg"
        alt="A dining room set for the evening service"
        className={cn("absolute inset-0 h-full w-full object-cover", ready && "landing-hero-ken-burns")}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/25" />
      <div className="relative flex min-h-[88vh] flex-col justify-end px-4 py-14 sm:px-6 sm:py-16 md:px-16 md:py-20">
        <p
          className={cn("landing-hero-line text-[11px] uppercase tracking-[0.28em] text-[#d4bc8a]", ready && "landing-hero-line-visible")}
          style={{ ["--hero-delay" as string]: "80ms" }}
        >
          This is ShiftSense
        </p>
        <h1
          className={cn(
            "display landing-hero-line mt-6 max-w-4xl text-4xl leading-[0.9] sm:text-6xl md:text-8xl",
            ready && "landing-hero-line-visible",
          )}
          style={{ ["--hero-delay" as string]: "200ms" }}
        >
          A quieter way to staff the room.
        </h1>
        <p
          className={cn(
            "landing-hero-line mt-6 max-w-md text-base leading-7 text-[#f4efe6]/85",
            ready && "landing-hero-line-visible",
          )}
          style={{ ["--hero-delay" as string]: "360ms" }}
        >
          Hospitality still rosters by last week&apos;s habit. ShiftSense reads demand, then tells you how many of each role the
          next service actually needs.
        </p>
        <Link
          href="/signup"
          className={cn(
            "landing-hero-line landing-cta mt-10 w-fit border border-[#f4efe6] px-5 py-3 text-[11px] uppercase tracking-[0.18em]",
            ready && "landing-hero-line-visible",
          )}
          style={{ ["--hero-delay" as string]: "520ms" }}
        >
          Create an account
        </Link>
      </div>
    </section>
  );
}
