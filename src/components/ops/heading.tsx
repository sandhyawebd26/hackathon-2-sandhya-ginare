export function Heading({
  kicker,
  title,
  copy,
}: {
  kicker: string;
  title: string;
  copy?: string;
}) {
  return (
    <header className="mb-10 max-w-3xl">
      <p className="text-[11px] uppercase tracking-[0.32em] text-accent">{kicker}</p>
      <h1 className="display mt-3 text-balance text-3xl leading-none sm:text-5xl lg:text-6xl">{title}</h1>
      {copy && <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">{copy}</p>}
    </header>
  );
}
