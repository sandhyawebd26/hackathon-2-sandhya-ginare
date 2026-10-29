"use client";

import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  Upload,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ThemeSwitch } from "@/components/theme/theme-switch";
import { cn } from "@/lib/utils";

const links: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/forecast", label: "Forecast", icon: CalendarDays },
  { href: "/staffing", label: "Staffing", icon: UtensilsCrossed },
  { href: "/roster", label: "Roster", icon: ClipboardList },
  { href: "/team", label: "Team", icon: Users },
  { href: "/roles", label: "Roles", icon: Settings2 },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/recommendations", label: "Approvals", icon: ClipboardList },
  { href: "/onboarding", label: "Import", icon: Upload },
];

function subscribeSidebar(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-sidebar"] });
  return () => observer.disconnect();
}

type VenueOption = { id: string; name: string; city: string };
type AlertItem = { id: string; message: string; severity: string; readAt: string | null };

export function OpsChrome({
  venues,
  accountName,
  children,
}: {
  venues: VenueOption[];
  accountName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const venue = params.get("venue") ?? venues[0]?.id ?? "";
  const current = venues.find((item) => item.id === venue) ?? venues[0];
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [openAlerts, setOpenAlerts] = useState(false);
  const collapsed = useSyncExternalStore(
    subscribeSidebar,
    () => document.documentElement.getAttribute("data-sidebar") === "closed",
    () => false,
  );

  useEffect(() => {
    if (!venue) return;
    fetch(`/api/alerts?venueId=${venue}`)
      .then((response) => response.json())
      .then((body: { data?: AlertItem[] }) => setAlerts(body.data ?? []))
      .catch(() => setAlerts([]));
  }, [venue, pathname]);

  function hrefFor(path: string) {
    const next = new URLSearchParams(params.toString());
    if (venue) next.set("venue", venue);
    const query = next.toString();
    return query ? `${path}?${query}` : path;
  }

  function toggleSidebar() {
    const next = collapsed ? "open" : "closed";
    localStorage.setItem("shiftsense-sidebar", next);
    if (next === "closed") document.documentElement.setAttribute("data-sidebar", "closed");
    else document.documentElement.removeAttribute("data-sidebar");
  }

  const unread = alerts.filter((alert) => !alert.readAt);

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside
        className={cn(
          "sticky top-0 flex h-dvh shrink-0 flex-col overflow-y-auto border-r border-border transition-[width] duration-200",
          collapsed ? "w-[72px]" : "w-72",
        )}
      >
        <div className={cn("flex items-center gap-2 px-4 py-5", collapsed && "justify-center px-2")}>
          <button type="button" onClick={toggleSidebar} aria-label={collapsed ? "Open sidebar" : "Close sidebar"} className="p-1">
            <Menu className="h-4 w-4" />
          </button>
          {!collapsed && (
            <Link href="/dashboard" className="display text-2xl leading-none">
              ShiftSense
            </Link>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2" aria-label="Admin">
          {links.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={hrefFor(link.href)}
                aria-current={active ? "page" : undefined}
                title={link.label}
                className={cn(
                  "flex items-center gap-3 border-l-2 px-3 py-2 text-[11px] uppercase tracking-[0.16em]",
                  active ? "border-accent text-foreground" : "border-transparent text-muted-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && link.label}
              </Link>
            );
          })}
        </nav>
        <div className={cn("space-y-3 border-t border-border px-4 py-4", collapsed && "px-2")}>
          {!collapsed && (
            <p className="text-base">
              {current?.name}
              <span className="mt-1 block text-sm normal-case tracking-normal text-muted-foreground">
                {current?.city} · {accountName}
              </span>
            </p>
          )}
          <button
            type="button"
            aria-label="Sign out"
            className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
              router.refresh();
            }}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && "Sign out"}
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-end gap-5 border-b border-border px-6 py-4">
          {venues.length > 1 && (
            <select
              aria-label="Venue"
              value={venue}
              onChange={(event) => {
                const next = new URLSearchParams(params.toString());
                next.set("venue", event.target.value);
                router.push(`${pathname}?${next.toString()}`);
              }}
              className="menu w-auto"
            >
              {venues.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          )}
          <ThemeSwitch />
          <button type="button" className="text-[11px] uppercase tracking-[0.16em]" onClick={() => setOpenAlerts((value) => !value)}>
            Alerts {unread.length ? `(${unread.length})` : ""}
          </button>
        </header>
        {openAlerts && (
          <div className="border-b border-border bg-card px-6 py-4">
            {alerts.length === 0 && <p className="text-sm text-muted-foreground">No open alerts.</p>}
            {alerts.slice(0, 6).map((alert) => (
              <p key={alert.id} className="py-1 text-sm">
                <span className="mr-3 text-[11px] uppercase tracking-[0.14em] text-accent">{alert.severity}</span>
                {alert.message}
              </p>
            ))}
          </div>
        )}
        <main className="px-6 py-10">{children}</main>
      </div>
    </div>
  );
}
