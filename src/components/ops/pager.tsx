import Link from "next/link";

import { cn } from "@/lib/utils";

export function Pager({
  page,
  pages,
  hrefFor,
}: {
  page: number;
  pages: number;
  hrefFor: (page: number) => string;
}) {
  if (pages <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  const numbers = Array.from({ length: end - start + 1 }, (_, index) => start + index);
  return (
    <nav className="mt-8 flex flex-wrap items-center gap-2" aria-label="Pages">
      <PagerLink href={page > 1 ? hrefFor(page - 1) : undefined}>Previous</PagerLink>
      {start > 1 && <PagerLink href={hrefFor(1)}>1</PagerLink>}
      {start > 2 && <span className="px-1 text-sm text-muted-foreground">…</span>}
      {numbers.map((number) => (
        <PagerLink key={number} href={hrefFor(number)} current={number === page}>
          {number}
        </PagerLink>
      ))}
      {end < pages - 1 && <span className="px-1 text-sm text-muted-foreground">…</span>}
      {end < pages && <PagerLink href={hrefFor(pages)}>{pages}</PagerLink>}
      <PagerLink href={page < pages ? hrefFor(page + 1) : undefined}>Next</PagerLink>
    </nav>
  );
}

function PagerLink({
  href,
  current,
  children,
}: {
  href?: string;
  current?: boolean;
  children: React.ReactNode;
}) {
  const className = cn(
    "inline-flex min-h-11 min-w-11 items-center justify-center border px-3 text-sm",
    current ? "border-foreground bg-foreground text-background" : "border-border",
    !href && "pointer-events-none opacity-40",
  );
  if (!href) {
    return <span className={className}>{children}</span>;
  }
  return (
    <Link href={href} aria-current={current ? "page" : undefined} className={className}>
      {children}
    </Link>
  );
}
