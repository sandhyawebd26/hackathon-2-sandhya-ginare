"use client";

import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

function subscribe(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

export function ThemeSwitch({ className }: { className?: string }) {
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.getAttribute("data-theme") === "dark",
    () => false,
  );

  function choose(next: boolean) {
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("shiftsense-theme", next ? "dark" : "light");
  }

  return (
    <div
      className={cn("flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] sm:gap-3", className)}
      role="group"
      aria-label="Color theme"
    >
      <button
        type="button"
        aria-pressed={!dark}
        onClick={() => choose(false)}
        className={cn(
          "min-h-11 min-w-11 border-b px-1 pb-1 sm:min-w-0",
          !dark ? "border-accent text-foreground" : "border-transparent text-muted-foreground",
        )}
      >
        Light
      </button>
      <button
        type="button"
        aria-pressed={dark}
        onClick={() => choose(true)}
        className={cn(
          "min-h-11 min-w-11 border-b px-1 pb-1 sm:min-w-0",
          dark ? "border-accent text-foreground" : "border-transparent text-muted-foreground",
        )}
      >
        Dark
      </button>
    </div>
  );
}
