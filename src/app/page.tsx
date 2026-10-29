import Link from "next/link";

import { ShiftSenseLogo } from "@/components/brand/logo";
import { SiteHeader } from "@/components/marketing/site-header";
import { LiveStamp } from "@/components/theme/live-stamp";

const houses = [
  {
    name: "Hotels",
    image: "/landing/hotel-lobby.jpg",
    alt: "A quiet hotel lobby in morning light",
    note: "Front office, housekeeping, and breakfast service, ready to edit.",
  },
  {
    name: "Restaurants",
    image: "/landing/restaurant-service.jpg",
    alt: "A dining table set for service",
    note: "A full kitchen and floor, from head chef to dishwasher.",
  },
  {
    name: "Cafés",
    image: "/landing/cafe-morning.jpg",
    alt: "A cafe counter in the morning",
    note: "Baristas, bakers, and the counter, with room for your own roles.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-full bg-background text-foreground">
      <SiteHeader />

      <section className="relative min-h-[88vh] text-[#f4efe6]">
        <img
          src="/landing/dining-room.jpg"
          alt="A dining room set for the evening service"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/25" />
        <div className="relative flex min-h-[88vh] flex-col justify-end px-4 py-14 sm:px-6 sm:py-16 md:px-16 md:py-20">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#d4bc8a]">This is ShiftSense</p>
          <h1 className="display mt-6 max-w-4xl text-4xl leading-[0.9] sm:text-6xl md:text-8xl">A quieter way to staff the room.</h1>
          <p className="mt-6 max-w-md text-base leading-7 text-[#f4efe6]/85">
            Hospitality still rosters by last week&apos;s habit. ShiftSense reads demand, then tells you how many of each role the next service actually needs.
          </p>
          <Link href="/signup" className="mt-10 w-fit border border-[#f4efe6] px-5 py-3 text-[11px] uppercase tracking-[0.18em]">
            Create an account
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-end gap-10 px-6 py-20 md:grid-cols-[0.8fr_1.2fr]">
        <LiveStamp />
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Today</p>
          <p className="display mt-4 text-5xl leading-none md:text-6xl">Predict the rush. Name the people. Publish the roster.</p>
        </div>
      </section>

      <section id="service" className="grid border-y border-border lg:grid-cols-2">
        <img src="/landing/kitchen-pass.jpg" alt="Plates leaving the kitchen pass" className="h-full min-h-[420px] w-full object-cover" />
        <div className="flex flex-col justify-center px-6 py-16 md:px-16">
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Service</p>
          <h2 className="display mt-4 text-5xl leading-none md:text-6xl">From the pass to the last table.</h2>
          <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
            Breakfast, lunch, and dinner are not one number. Each hour is read on its own, then the people who hold each role are named for that window.
          </p>
          <ul className="mt-10 space-y-4 text-base">
            <li className="border-t border-border pt-4">Kitchen, sized from orders</li>
            <li className="border-t border-border pt-4">Floor, sized from covers</li>
            <li className="border-t border-border pt-4">A weekly cap on every person</li>
          </ul>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent">The house</p>
          <h2 className="display mt-4 text-5xl leading-none">Rooms, linen, and the desk that never quite closes.</h2>
          <p className="mt-6 text-base leading-7 text-muted-foreground">
            Hotels start with front office, housekeeping, breakfast, and the night. You turn off what you do not use, and add the role the list forgot.
          </p>
        </div>
        <img src="/landing/housekeeping.jpg" alt="Folded linen in a hotel corridor" className="aspect-[3/4] w-full object-cover" />
      </section>

      <section id="houses" className="mx-auto grid max-w-6xl gap-8 px-6 pb-8 md:grid-cols-3">
        {houses.map((house, index) => (
          <article key={house.name}>
            <img src={house.image} alt={house.alt} className="aspect-[4/3] w-full object-cover" />
            <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">0{index + 1} / 03</p>
            <h2 className="display mt-3 text-5xl leading-none">{house.name}</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{house.note}</p>
          </article>
        ))}
      </section>

      <section className="relative mt-12 min-h-[70vh] text-[#f4efe6]">
        <img src="/landing/evening-bar.jpg" alt="A hotel bar in the evening" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative flex min-h-[70vh] flex-col justify-end px-6 py-16 md:px-16">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#d4bc8a]">After six</p>
          <p className="display mt-4 max-w-3xl text-5xl leading-none md:text-7xl">The room changes. The roster should too.</p>
        </div>
      </section>

      <section id="week" className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2">
        <img src="/landing/breakfast-table.jpg" alt="A breakfast table set by the window" className="aspect-[4/3] w-full object-cover" />
        <div className="flex flex-col justify-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent">The week</p>
          <h2 className="display mt-4 text-5xl leading-none">Drafted before the first sitting.</h2>
          <ol className="mt-8 space-y-6 text-base leading-7">
            <li>
              <span className="text-[11px] uppercase tracking-[0.18em] text-accent">01</span>
              <p className="mt-1">Eight weeks of covers and orders, plus the weather and the calendar.</p>
            </li>
            <li>
              <span className="text-[11px] uppercase tracking-[0.18em] text-accent">02</span>
              <p className="mt-1">Each role keeps a ratio. Headcount is calculated, never guessed.</p>
            </li>
            <li>
              <span className="text-[11px] uppercase tracking-[0.18em] text-accent">03</span>
              <p className="mt-1">Names are placed on the week. You rebuild it when the team changes.</p>
            </li>
          </ol>
          <Link href="/signup" className="mt-10 w-fit border border-current px-5 py-3 text-[11px] uppercase tracking-[0.18em]">
            Open your house
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 border-t border-border px-4 py-12 sm:px-6 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <ShiftSenseLogo href="/" size="lg" />
        <Link href="/login">Sign in</Link>
        <Link href="/signup">Create an account</Link>
      </footer>
    </div>
  );
}
