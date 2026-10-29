"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { opsDrawerMediaQuery } from "@/lib/breakpoints";

type Point = { label: string; predicted: number; lower?: number; upper?: number };

function subscribeNarrow(onStoreChange: () => void) {
  const mq = window.matchMedia(opsDrawerMediaQuery());
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

export function DemandChart({ points, yLabel = "Covers / hour" }: { points: Point[]; yLabel?: string }) {
  const [colors, setColors] = useState({ line: "#1b1916", fill: "#8c6840", grid: "#6f675d" });
  const narrow = useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(opsDrawerMediaQuery()).matches,
    () => true,
  );

  useEffect(() => {
    const read = () => {
      const dark = document.documentElement.getAttribute("data-theme") === "dark";
      setColors(
        dark
          ? { line: "#f3eee6", fill: "#d4bc8a", grid: "#b7aea2" }
          : { line: "#1b1916", fill: "#8c6840", grid: "#6f675d" },
      );
    };
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.setTimeout(read, 0);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-w-0 w-full">
      <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{yLabel}</p>
      <div className="h-56 w-full min-w-[280px] sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 10, right: 8, left: 0, bottom: narrow ? 28 : 8 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: colors.grid, fontSize: narrow ? 9 : 11 }}
              tickLine={false}
              axisLine={false}
              interval={narrow ? "preserveStartEnd" : "equidistantPreserveStart"}
              angle={narrow ? -35 : 0}
              textAnchor={narrow ? "end" : "middle"}
              height={narrow ? 52 : 30}
            />
            <YAxis tick={{ fill: colors.grid, fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
            <Tooltip
              formatter={(value) => [`${value ?? 0} covers`, "Predicted"]}
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                borderRadius: 0,
                maxWidth: "min(90vw, 16rem)",
              }}
            />
            <Area type="monotone" dataKey="predicted" stroke={colors.line} fill={colors.fill} fillOpacity={0.25} strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
