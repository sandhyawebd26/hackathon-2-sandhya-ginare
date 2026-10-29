"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { useEffect, useMemo, useRef, useState } from "react";

import { ActionFeedback, type ActionFeedbackState } from "@/components/ops/action-feedback";
import { Button } from "@/components/ui/button";
import { guessCsvMapping, validateImportMapping, type ImportKind } from "@/lib/csv-mapping";
import { parseFlexibleTimestamp } from "@/lib/time";

const salesFields = [
  ["timestamp", "Timestamp"],
  ["covers", "Covers"],
  ["orders", "Orders"],
  ["value", "Value"],
  ["channel", "Channel"],
] as const;

const reservationFields = [
  ["timestamp", "Timestamp"],
  ["partySize", "Party size"],
  ["status", "Status"],
  ["source", "Source"],
] as const;

type SuccessNotice = {
  kind: ImportKind;
  rowCount: number;
  filename: string;
  peekDate?: string;
  summary: string;
};

export function ImportForm({ venueId, timezone }: { venueId: string; timezone: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<ImportKind>("sales");
  const [headers, setHeaders] = useState<string[]>([]);
  const [csv, setCsv] = useState("");
  const [filename, setFilename] = useState("upload.csv");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<ActionFeedbackState>(null);
  const [pending, setPending] = useState(false);
  const [successNotice, setSuccessNotice] = useState<SuccessNotice | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setCsv("");
    setHeaders([]);
    setMapping({});
    setFilename("upload.csv");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function readCsv(text: string, name: string, importKind: ImportKind = kind) {
    setSuccessNotice(null);
    setFeedback(null);
    setCsv(text);
    setFilename(name);
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, preview: 1, skipEmptyLines: true });
    const fields = parsed.meta.fields?.filter(Boolean) ?? [];
    setHeaders(fields);
    setMapping(guessCsvMapping(fields, importKind));
  }

  useEffect(() => {
    if (headers.length) setMapping(guessCsvMapping(headers, kind));
  }, [kind, headers]);

  const preview = useMemo(() => {
    if (!csv || !mapping.timestamp) return null;
    const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true, preview: 3 });
    return parsed.data.map((row, index) => {
      const rawDate = row[mapping.timestamp] ?? "";
      const stamp = parseFlexibleTimestamp(rawDate, timezone);
      const party =
        kind === "reservations" && mapping.partySize
          ? Number(String(row[mapping.partySize] ?? "").replace(/[^0-9.-]/g, ""))
          : null;
      return {
        row: index + 2,
        rawDate,
        okDate: Boolean(stamp),
        party: Number.isFinite(party) ? party : null,
      };
    });
  }, [csv, kind, mapping.partySize, mapping.timestamp, timezone]);

  const fields = kind === "sales" ? salesFields : reservationFields;
  const mappingIssue = csv ? validateImportMapping(kind, mapping) : null;

  const staffingHref =
    successNotice?.peekDate && successNotice.kind === "reservations"
      ? `/staffing?venue=${venueId}&date=${successNotice.peekDate}`
      : `/staffing?venue=${venueId}`;

  return (
    <div className="space-y-8">
      {successNotice ? (
        <aside className="space-y-5 border border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Import complete</p>
              <p className="display mt-2 text-2xl">
                {successNotice.rowCount} {successNotice.kind === "sales" ? "sales rows" : "reservations"} from{" "}
                {successNotice.filename}
              </p>
              <p className="mt-2 text-sm text-accent">{successNotice.summary}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The form below is cleared so you can import another file.
              </p>
            </div>
            <button
              type="button"
              className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
              onClick={() => setSuccessNotice(null)}
            >
              Dismiss
            </button>
          </div>
          <ul className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <li className="text-sm">
              <p className="text-[11px] uppercase tracking-[0.16em] text-accent">Forecast</p>
              <p className="mt-1 text-muted-foreground">
                {successNotice.kind === "sales"
                  ? "Historical sales shift the hourly covers curve (same weekday / hour baseline)."
                  : "Bookings add demand on the dates you imported."}
              </p>
              <Link href={`/forecast?venue=${venueId}`} className="mt-2 inline-block text-sm underline">
                Open Forecast
              </Link>
            </li>
            <li className="text-sm">
              <p className="text-[11px] uppercase tracking-[0.16em] text-accent">Staffing</p>
              <p className="mt-1 text-muted-foreground">Required headcount per role and hour uses the new numbers.</p>
              <Link href={staffingHref} className="mt-2 inline-block text-sm underline">
                Open Staffing{successNotice.peekDate ? ` (${successNotice.peekDate})` : ""}
              </Link>
            </li>
            <li className="text-sm">
              <p className="text-[11px] uppercase tracking-[0.16em] text-accent">Approvals</p>
              <p className="mt-1 text-muted-foreground">New gaps where scheduled staff ≠ required appear in the queue.</p>
              <Link href={`/recommendations?venue=${venueId}`} className="mt-2 inline-block text-sm underline">
                Open Approvals
              </Link>
            </li>
            <li className="text-sm">
              <p className="text-[11px] uppercase tracking-[0.16em] text-accent">Dashboard</p>
              <p className="mt-1 text-muted-foreground">
                Peak covers, under/over counts, and alerts refresh from the same replan.
              </p>
              <Link href={`/dashboard?venue=${venueId}`} className="mt-2 inline-block text-sm underline">
                Open Dashboard
              </Link>
            </li>
          </ul>
        </aside>
      ) : null}

      <form
        className="space-y-8"
        onSubmit={async (event) => {
          event.preventDefault();
          const issue = validateImportMapping(kind, mapping);
          if (issue) {
            setFeedback({ tone: "error", text: issue });
            return;
          }
          setPending(true);
          setFeedback(null);
          const importedFilename = filename;
          const importedKind = kind;
          try {
            const response = await fetch("/api/imports", {
              method: "POST",
              credentials: "same-origin",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ venueId, kind, filename, csv, mapping }),
            });
            const body = (await response.json()) as {
              message?: string;
              errors?: string[];
              success?: boolean;
              data?: { rowCount?: number; kind?: ImportKind; filename?: string; peekDate?: string };
            };

            if (body.success && body.data) {
              setSuccessNotice({
                kind: body.data.kind ?? importedKind,
                rowCount: body.data.rowCount ?? 0,
                filename: body.data.filename ?? importedFilename,
                peekDate: body.data.peekDate,
                summary: body.message ?? "Import complete — the week was recalculated.",
              });
              resetForm();
              router.refresh();
            } else {
              setFeedback({
                tone: "error",
                text: [body.message, ...(body.errors ?? [])].filter(Boolean).join(" ") || "Import failed.",
              });
            }
          } catch (err) {
            setFeedback({
              tone: "error",
              text: err instanceof Error ? err.message : "Import failed.",
            });
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="flex gap-6 text-[11px] uppercase tracking-[0.18em]">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="kind"
              checked={kind === "sales"}
              onChange={() => {
                setKind("sales");
                setSuccessNotice(null);
                setFeedback(null);
              }}
            />
            Sales
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="kind"
              checked={kind === "reservations"}
              onChange={() => {
                setKind("reservations");
                setSuccessNotice(null);
                setFeedback(null);
              }}
            />
            Reservations
          </label>
        </div>
        <p className="text-sm text-muted-foreground">
          {kind === "reservations"
            ? "Map Timestamp to the booking time column and Party size to guest count (both required). Status and Source can stay on Skip."
            : "Map Timestamp to the sale time. Other sales columns are optional."}
        </p>
        <label className="block text-[11px] uppercase tracking-[0.18em]">
          CSV file
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="mt-3 block w-full text-sm tracking-normal normal-case"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              readCsv(await file.text(), file.name);
            }}
          />
        </label>
        <button
          type="button"
          className="cursor-pointer text-[11px] uppercase tracking-[0.18em] text-accent hover:underline"
          onClick={async () => {
            const path = kind === "sales" ? "/demo/sales-sample.csv" : "/demo/reservations-sample.csv";
            const text = await fetch(path).then((response) => response.text());
            readCsv(text, path.split("/").pop() ?? "sample.csv", kind);
          }}
        >
          Load the sample file
        </button>
        {headers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map(([key, label]) => (
              <label key={key} className="text-[11px] uppercase tracking-[0.18em]">
                {label}
                {key === "partySize" && kind === "reservations" ? " (required)" : ""}
                <select
                  className="menu mt-2"
                  value={mapping[key] ?? ""}
                  onChange={(event) => setMapping((current) => ({ ...current, [key]: event.target.value }))}
                >
                  <option value="">Skip</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        ) : null}
        {mappingIssue && headers.length > 0 ? <p className="text-sm text-under">{mappingIssue}</p> : null}
        {preview && preview.length > 0 ? (
          <div className="border border-border p-4 text-sm">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Preview (first rows)</p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              {preview.map((row) => (
                <li key={row.row}>
                  Row {row.row}: date {row.okDate ? "ok" : "unreadable"} ({row.rawDate || "empty"})
                  {kind === "reservations" ? ` · party ${row.party && row.party > 0 ? row.party : "missing"}` : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <Button type="submit" disabled={pending || !csv || Boolean(mappingIssue)}>
          {pending ? "Importing" : "Import and recalculate"}
        </Button>
        <ActionFeedback feedback={feedback} />
      </form>
    </div>
  );
}
