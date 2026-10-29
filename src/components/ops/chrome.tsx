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
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { ShiftSenseLogo } from "@/components/brand/logo";
import { ThemeSwitch } from "@/components/theme/theme-switch";
import { opsDrawerMediaQuery } from "@/lib/breakpoints";
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

function subscribeDrawer(onStoreChange: () => void) {
  const mq = window.matchMedia(opsDrawerMediaQuery());
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
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
  const [mobileNav, setMobileNav] = useState(false);

  const collapsed = useSyncExternalStore(
    subscribeSidebar,
    () => document.documentElement.getAttribute("data-sidebar") === "closed",
    () => true,
  );

  const drawerNav = useSyncExternalStore(
    subscribeDrawer,
    () => window.matchMedia(opsDrawerMediaQuery()).matches,
    () => true,
  );

  const sidebarOpen = drawerNav ? mobileNav : !collapsed;

  useEffect(() => {
    if (!mobileNav) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileNav]);

  useEffect(() => {
    setMobileNav(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerNav) setMobileNav(false);
  }, [drawerNav]);

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

  const toggleSidebar = useCallback(() => {
    if (drawerNav) {
      setMobileNav((value) => !value);
      return;
    }
    const next = collapsed ? "open" : "closed";
    localStorage.setItem("shiftsense-sidebar", next);
    if (next === "closed") document.documentElement.setAttribute("data-sidebar", "closed");
    else document.documentElement.removeAttribute("data-sidebar");
  }, [collapsed, drawerNav]);

  const closeMobileNav = useCallback(() => setMobileNav(false), []);

  const unread = alerts.filter((alert) => !alert.readAt);
  const showLabels = drawerNav || !collapsed;

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      {drawerNav && mobileNav ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-hero/55 lg:hidden"
          onClick={closeMobileNav}
        />
      ) : null}

      <aside
        className={cn(
          "z-50 flex h-dvh shrink-0 flex-col overflow-y-auto border-r border-border bg-background transition-[transform,width] duration-200 safe-area-pad",
          drawerNav ? "fixed inset-y-0 left-0 w-[min(100vw-3rem,18rem)] shadow-xl" : "sticky top-0",
          drawerNav && !mobileNav && "-translate-x-full",
          drawerNav && mobileNav && "translate-x-0",
          !drawerNav && (collapsed ? "w-[72px]" : "w-72"),
        )}
        aria-hidden={drawerNav && !mobileNav ? true : undefined}
      >
        <div className={cn("flex items-center gap-2 px-4 py-4", !showLabels && "justify-center px-2")}>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            className="inline-flex min-h-11 min-w-11 items-center justify-center p-1"
          >
            {drawerNav && mobileNav ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          {showLabels ? <ShiftSenseLogo href={hrefFor("/dashboard")} size="md" className="min-w-0 truncate" /> : null}
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2 pb-4" aria-label="Admin">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={hrefFor(link.href)}
                aria-current={active ? "page" : undefined}
                title={link.label}
                onClick={closeMobileNav}
                className={cn(
                  "flex min-h-11 items-center gap-3 border-l-[3px] px-3 py-2 text-[11px] uppercase tracking-[0.16em] transition-colors",
                  active
                    ? "border-accent bg-accent/15 font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  !showLabels && "justify-center px-0",
                  !showLabels && active && "bg-accent/20",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-accent")} />
                {showLabels ? link.label : null}
              </Link>
            );
          })}
        </nav>
        <div className={cn("space-y-3 border-t border-border px-4 py-4", !showLabels && "px-2")}>
          {showLabels ? (
            <p className="text-base">
              {current?.name}
              <span className="mt-1 block text-sm normal-case tracking-normal text-muted-foreground">
                {current?.city} · {accountName}
              </span>
            </p>
          ) : null}
          <button
            type="button"
            aria-label="Sign out"
            className="flex min-h-11 items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
              router.refresh();
            }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {showLabels ? "Sign out" : null}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="safe-area-pad flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3 lg:hidden">
            <button
              type="button"
              aria-label="Open navigation"
              className="inline-flex min-h-11 min-w-11 items-center justify-center border border-border"
              onClick={() => setMobileNav(true)}
            >
              <Menu className="h-4 w-4" />
            </button>
            <ShiftSenseLogo href={hrefFor("/dashboard")} showWordmark={false} size="sm" />
          </div>
          <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:ml-auto sm:w-auto sm:gap-5">
            {venues.length > 1 && (
              <select
                aria-label="Venue"
                value={venue}
                onChange={(event) => {
                  const next = new URLSearchParams(params.toString());
                  next.set("venue", event.target.value);
                  router.push(`${pathname}?${next.toString()}`);
                }}
                className="menu max-w-full flex-1 text-sm sm:max-w-[14rem] sm:flex-none"
              >
                {venues.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            )}
            <ThemeSwitch className="shrink-0" />
            <button
              type="button"
              className="min-h-11 shrink-0 px-1 text-[11px] uppercase tracking-[0.16em]"
              onClick={() => setOpenAlerts((value) => !value)}
            >
              Alerts{unread.length ? ` (${unread.length})` : ""}
            </button>
          </div>
        </header>
        {openAlerts && (
          <div className="border-b border-border bg-card px-4 py-4 sm:px-6">
            {alerts.length === 0 && <p className="text-sm text-muted-foreground">No open alerts.</p>}
            {alerts.slice(0, 6).map((alert) => (
              <p key={alert.id} className="py-1 text-sm">
                <span className="mr-3 text-[11px] uppercase tracking-[0.14em] text-accent">{alert.severity}</span>
                {alert.message}
              </p>
            ))}
          </div>
        )}
        <main className="px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
