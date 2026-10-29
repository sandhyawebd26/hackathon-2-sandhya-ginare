import { staffPortraitFor } from "@/lib/staff-portraits";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-10 w-10 text-sm",
  md: "h-14 w-14 text-base",
  lg: "h-20 w-20 text-lg",
} as const;

export function StaffAvatar({
  id,
  name,
  role,
  size = "md",
  className,
}: {
  id: string;
  name: string;
  role: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const portrait = staffPortraitFor({ id, role, name });
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden border border-border bg-muted",
        sizes[size],
        className,
      )}
    >
      <img src={portrait.src} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden />
      <span className="sr-only">{portrait.alt}</span>
      <span
        className="absolute inset-0 flex items-center justify-center bg-background/80 font-medium text-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
        aria-hidden
      >
        {initials}
      </span>
    </div>
  );
}
