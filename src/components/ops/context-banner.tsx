export function ContextBanner({
  title,
  lines,
}: {
  title: string;
  lines: string[];
}) {
  return (
    <aside className="mb-8 border border-border bg-card p-5">
      <p className="text-[11px] uppercase tracking-[0.24em] text-accent">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </aside>
  );
}
