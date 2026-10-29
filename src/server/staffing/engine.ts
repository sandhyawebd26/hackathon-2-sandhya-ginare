import type { Reason, RoleConfig, Shift } from "@/lib/domain";

export function scheduledAt(shifts: Shift[], role: string, hour: Date) {
  const ts = hour.getTime();
  return shifts.filter(
    (shift) =>
      shift.role === role &&
      new Date(shift.startsAt).getTime() <= ts &&
      new Date(shift.endsAt).getTime() > ts,
  ).length;
}

export function requiredHeadcount(demand: number, config: RoleConfig) {
  if (demand <= 0) return 0;
  return Math.ceil(demand / config.coversPerStaffHour);
}

export function describeReasons(input: {
  weekday: string;
  baseline: number;
  predicted: number;
  holiday?: string;
  weather?: string;
  event?: string;
  reserved: number;
  metricLabel: string;
}): Reason[] {
  const reasons: Reason[] = [
    {
      code: "history",
      label: "Historical average",
      detail: `${Math.round(input.baseline)} ${input.metricLabel} on a typical ${input.weekday} at this hour`,
    },
  ];
  if (input.holiday) {
    reasons.push({
      code: "holiday",
      label: input.holiday,
      detail: "Public holiday lift applied to the baseline",
    });
  }
  if (input.weather) {
    reasons.push({
      code: "weather",
      label: input.weather,
      detail: "Weather is softening expected walk-in demand",
    });
  }
  if (input.event) {
    reasons.push({
      code: "event",
      label: input.event,
      detail: "A manager-entered event raises this window",
    });
  }
  if (input.reserved > 0) {
    reasons.push({
      code: "reservations",
      label: `${input.reserved} covers reserved`,
      detail: "Confirmed parties are a floor under the forecast",
    });
  }
  reasons.push({
    code: "forecast",
    label: `${Math.round(input.predicted)} ${input.metricLabel} expected`,
    detail: "Weighted cyclical average after weather, holiday, and event multipliers",
  });
  return reasons;
}
