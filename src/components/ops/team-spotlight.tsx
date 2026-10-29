import { STAFF_SCENE_IMAGES } from "@/lib/staff-portraits";

export function TeamSpotlight() {
  return (
    <div className="mb-10 grid gap-4 border border-border lg:grid-cols-[1.2fr_0.8fr]">
      <img
        src={STAFF_SCENE_IMAGES.line.src}
        alt={STAFF_SCENE_IMAGES.line.alt}
        className="min-h-[220px] w-full object-cover lg:min-h-full"
      />
      <div className="flex flex-col justify-center px-6 py-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Workload</p>
        <p className="display mt-3 text-3xl leading-none sm:text-4xl">People first, then the numbers.</p>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Photos here represent your floor, kitchen, bar, and house teams. Each roster line ties back to a named person and
          their weekly cap.
        </p>
      </div>
    </div>
  );
}
