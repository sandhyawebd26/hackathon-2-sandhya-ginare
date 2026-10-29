/** Shared vector mark for ShiftSense (cloche + twin shift arcs). */
export function LogoMarkPaths({
  gold = "var(--logo-gold, #d4bc8a)",
  cream = "var(--logo-cream, #f4efe6)",
}: {
  gold?: string;
  cream?: string;
}) {
  return (
    <>
      <path
        d="M16 4.5a11.5 11.5 0 0 1 9.2 18.6"
        stroke={gold}
        strokeWidth="1.65"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M16 27.5a11.5 11.5 0 0 1-9.2-18.6"
        stroke={gold}
        strokeWidth="1.65"
        fill="none"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path d="M16 10.25V8.5" stroke={gold} strokeWidth="1.35" strokeLinecap="round" />
      <circle cx="16" cy="7.75" r="0.85" fill={gold} />
      <path
        d="M10.5 19.25c0-3.85 2.15-6.75 5.5-6.75s5.5 2.9 5.5 6.75"
        stroke={cream}
        strokeWidth="1.45"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M9 19.25h14" stroke={cream} strokeWidth="1.45" strokeLinecap="round" />
      <path d="M13.25 21.25h5.5" stroke={cream} strokeWidth="1.15" strokeLinecap="round" opacity="0.85" />
    </>
  );
}
