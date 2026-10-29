"use client";

import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

function subscribe(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

export function ThemeSwitch() {
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
    <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em]" role="group" aria-label="Color theme">
      <button
        type="button"
        aria-pressed={!dark}
        onClick={() => choose(false)}
        className={cn("border-b pb-1", !dark ? "border-accent text-foreground" : "border-transparent text-muted-foreground")}
      >
        Light
      </button>
      <button
        type="button"
        aria-pressed={dark}
        onClick={() => choose(true)}
        className={cn("border-b pb-1", dark ? "border-accent text-foreground" : "border-transparent text-muted-foreground")}
      >
        Dark
      </button>
    </div>
  );
}
