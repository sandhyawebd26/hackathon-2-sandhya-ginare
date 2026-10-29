import { zonedParts } from "@/lib/time";

export type HistoryPoint = { ts: string; value: number };

export type WcmaResult = {
  predicted: number;
  lower: number;
  upper: number;
  baseline: number;
  sampleCount: number;
};

export function indexHistory(rows: HistoryPoint[], timeZone: string) {
  const index = new Map<string, HistoryPoint[]>();
  for (const row of rows) {
    const parts = zonedParts(new Date(row.ts), timeZone);
    const key = `${parts.weekday}-${parts.hour}`;
    const bucket = index.get(key) ?? [];
    bucket.push(row);
    index.set(key, bucket);
  }
  return index;
}

export function wcmaAt(
  index: Map<string, HistoryPoint[]>,
  target: Date,
  timeZone: string,
  weeks = 8,
): WcmaResult {
  const parts = zonedParts(target, timeZone);
  const bucket = index.get(`${parts.weekday}-${parts.hour}`) ?? [];
  const samples: { value: number; weight: number }[] = [];
  for (const row of bucket) {
    const weeksAgo = Math.round((target.getTime() - new Date(row.ts).getTime()) / (7 * 86_400_000));
    if (weeksAgo < 1 || weeksAgo > weeks) continue;
    samples.push({ value: row.value, weight: weeks - weeksAgo + 1 });
  }
  const source = samples.length
    ? samples
    : bucket.map((row) => ({ value: row.value, weight: 1 }));
  if (!source.length) {
    return { predicted: 0, lower: 0, upper: 0, baseline: 0, sampleCount: 0 };
  }
  const weightSum = source.reduce((sum, sample) => sum + sample.weight, 0);
  const predicted = source.reduce((sum, sample) => sum + sample.value * sample.weight, 0) / weightSum;
  const baseline = source.reduce((sum, sample) => sum + sample.value, 0) / source.length;
  const variance =
    source.reduce((sum, sample) => sum + (sample.value - baseline) ** 2, 0) / source.length;
  const spread = Math.sqrt(variance);
  return {
    predicted: Math.max(0, predicted),
    lower: Math.max(0, predicted - spread),
    upper: predicted + spread,
    baseline,
    sampleCount: source.length,
  };
}
