"use client";

import Link from "next/link";
import { useId } from "react";

import { LogoMarkPaths } from "@/components/brand/logo-mark-svg";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { mark: 30, word: "text-xl", gap: "gap-2" },
  md: { mark: 38, word: "text-2xl", gap: "gap-2.5" },
  lg: { mark: 46, word: "text-[1.75rem] sm:text-3xl", gap: "gap-3" },
} as const;

export function ShiftSenseMark({
  size = 32,
  className,
  variant = "default",
}: {
  size?: number;
  className?: string;
  variant?: "default" | "onDark";
}) {
  const uid = useId().replace(/:/g, "");
  const bgId = `ss-bg-${uid}`;
  const goldId = `ss-gold-${uid}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("shrink-0 drop-shadow-sm", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={bgId} x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor={variant === "onDark" ? "#1a1714" : "#221e19"} />
          <stop offset="1" stopColor="#0f0d0b" />
        </linearGradient>
        <linearGradient id={goldId} x1="8" y1="6" x2="24" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ecd09a" />
          <stop offset="1" stopColor="#a67c42" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${bgId})`} />
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="8.25"
        fill="none"
        stroke={`url(#${goldId})`}
        strokeWidth="0.5"
        opacity="0.35"
      />
      <LogoMarkPaths gold={`url(#${goldId})`} cream="#f6f0e6" />
    </svg>
  );
}

function Wordmark({ size, onDark }: { size: keyof typeof sizes; onDark: boolean }) {
  return (
    <span
      className={cn(
        "display leading-[0.95] tracking-[-0.01em]",
        sizes[size].word,
        onDark ? "text-[#f4efe6]" : "text-foreground",
      )}
    >
      Shift
      <span className={onDark ? "text-[#d4bc8a]" : "text-accent"}>Sense</span>
    </span>
  );
}

export function ShiftSenseLogo({
  href = "/",
  showWordmark = true,
  size = "md",
  className,
  onDark = false,
  tagline,
}: {
  href?: string;
  showWordmark?: boolean;
  size?: keyof typeof sizes;
  className?: string;
  onDark?: boolean;
  tagline?: string;
}) {
  const spec = sizes[size];
  const inner = (
    <>
      <ShiftSenseMark size={spec.mark} variant={onDark ? "onDark" : "default"} />
      {showWordmark ? (
        <span className="min-w-0">
          <Wordmark size={size} onDark={onDark} />
          {tagline ? (
            <span
              className={cn(
                "mt-0.5 hidden text-[10px] uppercase tracking-[0.26em] sm:block",
                onDark ? "text-[#f4efe6]/70" : "text-muted-foreground",
              )}
            >
              {tagline}
            </span>
          ) : null}
        </span>
      ) : null}
    </>
  );

  const classes = cn("inline-flex items-center", spec.gap, className);

  if (href) {
    return (
      <Link href={href} className={classes} aria-label="ShiftSense home">
        {inner}
      </Link>
    );
  }

  return <span className={classes}>{inner}</span>;
}
