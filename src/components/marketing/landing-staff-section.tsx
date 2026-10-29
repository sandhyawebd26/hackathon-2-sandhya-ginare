"use client";

import { LANDING_STAFF_TILES, STAFF_SCENE_IMAGES } from "@/lib/staff-portraits";

import { Reveal } from "@/components/marketing/reveal";

export function LandingStaffSection() {
  return (
    <section id="team" className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Your team</p>
          <h2 className="display mt-4 text-4xl leading-none sm:text-5xl md:text-6xl">
            Workload planning starts with real people.
          </h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
            ShiftSense sizes each role from demand, then maps names to the week. Every person keeps a weekly hour cap so the
            roster stays human.
          </p>
        </Reveal>
        <Reveal delay={120} className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
          {LANDING_STAFF_TILES.map((tile, index) => (
            <figure
              key={tile.label}
              className="landing-image-hover group relative aspect-[3/4] overflow-hidden"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <img src={tile.src} alt={tile.alt} className="h-full w-full object-cover" loading="lazy" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3 text-[11px] uppercase tracking-[0.18em] text-[#f4efe6]">
                {tile.label}
              </figcaption>
            </figure>
          ))}
        </Reveal>
      </div>
      <Reveal className="landing-image-hover mx-auto max-w-6xl px-6 pb-20">
        <img
          src={STAFF_SCENE_IMAGES.briefing.src}
          alt={STAFF_SCENE_IMAGES.briefing.alt}
          className="aspect-[21/9] w-full object-cover"
          loading="lazy"
        />
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{STAFF_SCENE_IMAGES.briefing.alt}</p>
      </Reveal>
    </section>
  );
}
