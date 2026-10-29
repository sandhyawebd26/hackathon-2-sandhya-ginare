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

function subscribeMobile(onStoreChange: () => void) {
  const mq = window.matchMedia("(max-width: 767px)");
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

  const isMobile = useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false,
  );

  const sidebarOpen = isMobile ? mobileNav : !collapsed;

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
    if (!isMobile) setMobileNav(false);
  }, [isMobile]);

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
    if (isMobile) {
      setMobileNav((value) => !value);
      return;
    }
    const next = collapsed ? "open" : "closed";
    localStorage.setItem("shiftsense-sidebar", next);
    if (next === "closed") document.documentElement.setAttribute("data-sidebar", "closed");
    else document.documentElement.removeAttribute("data-sidebar");
  }, [collapsed, isMobile]);

  const closeMobileNav = useCallback(() => setMobileNav(false), []);

  const unread = alerts.filter((alert) => !alert.readAt);
  const showLabels = isMobile || !collapsed;

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      {isMobile && mobileNav ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-hero/55 md:hidden"
          onClick={closeMobileNav}
        />
      ) : null}

      <aside
        className={cn(
          "z-50 flex h-dvh shrink-0 flex-col overflow-y-auto border-r border-border bg-background transition-[transform,width] duration-200",
          isMobile ? "fixed inset-y-0 left-0 w-72 shadow-xl" : "sticky top-0",
          isMobile && !mobileNav && "-translate-x-full",
          isMobile && mobileNav && "translate-x-0",
          !isMobile && (collapsed ? "w-[72px]" : "w-72"),
        )}
        aria-hidden={isMobile && !mobileNav ? true : undefined}
      >
        <div className={cn("flex items-center gap-2 px-4 py-4", !showLabels && "justify-center px-2")}>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            className="inline-flex min-h-11 min-w-11 items-center justify-center p-1"
          >
            {isMobile && mobileNav ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          {showLabels ? <ShiftSenseLogo href={hrefFor("/dashboard")} size="md" className="min-w-0 truncate" /> : null}
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2 pb-4" aria-label="Admin">
          {links.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={hrefFor(link.href)}
                aria-current={active ? "page" : undefined}
                title={link.label}
                onClick={closeMobileNav}
                className={cn(
                  "flex min-h-11 items-center gap-3 border-l-2 px-3 py-2 text-[11px] uppercase tracking-[0.16em]",
                  active ? "border-accent text-foreground" : "border-transparent text-muted-foreground",
                  !showLabels && "justify-center px-0",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
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
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3 md:hidden">
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
          <div className="ml-auto flex flex-wrap items-center justify-end gap-3 sm:gap-5">
            {venues.length > 1 && (
              <select
                aria-label="Venue"
                value={venue}
                onChange={(event) => {
                  const next = new URLSearchParams(params.toString());
                  next.set("venue", event.target.value);
                  router.push(`${pathname}?${next.toString()}`);
                }}
                className="menu max-w-[min(100%,14rem)] w-auto text-sm"
              >
                {venues.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            )}
            <ThemeSwitch />
            <button
              type="button"
              className="min-h-11 px-1 text-[11px] uppercase tracking-[0.16em]"
              onClick={() => setOpenAlerts((value) => !value)}
            >
              Alerts {unread.length ? `(${unread.length})` : ""}
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
