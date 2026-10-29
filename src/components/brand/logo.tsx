import Link from "next/link";

import { cn } from "@/lib/utils";

const sizes = {
  sm: { mark: 28, word: "text-xl" },
  md: { mark: 36, word: "text-2xl" },
  lg: { mark: 44, word: "text-3xl" },
} as const;

export function ShiftSenseMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect width="32" height="32" rx="6" className="fill-[#161411] dark:fill-[#f3eee6]" />
      <path
        d="M16 7c-4.97 0-9 4.03-9 9 0 3.1 1.58 5.83 3.97 7.43L16 25l5.03-1.57C23.42 21.83 25 19.1 25 16c0-4.97-4.03-9-9-9Z"
        className="stroke-accent"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M16 11v5l3.5 2"
        className="stroke-foreground"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="16" cy="16" r="1.25" className="fill-accent" />
    </svg>
  );
}

export function ShiftSenseLogo({
  href = "/",
  showWordmark = true,
  size = "md",
  className,
  onDark = false,
}: {
  href?: string;
  showWordmark?: boolean;
  size?: keyof typeof sizes;
  className?: string;
  /** Force light wordmark on photography / dark panels. */
  onDark?: boolean;
}) {
  const spec = sizes[size];
  const inner = (
    <>
      <ShiftSenseMark size={spec.mark} className={onDark ? "[&_rect]:fill-[#161411]" : undefined} />
      {showWordmark ? (
        <span
          className={cn(
            "display leading-none tracking-normal",
            spec.word,
            onDark ? "text-[#f4efe6]" : "text-foreground",
          )}
        >
          ShiftSense
        </span>
      ) : null}
    </>
  );

  const classes = cn("inline-flex items-center gap-2.5", className);

  if (href) {
    return (
      <Link href={href} className={classes} aria-label="ShiftSense home">
        {inner}
      </Link>
    );
  }

  return <span className={classes}>{inner}</span>;
}
