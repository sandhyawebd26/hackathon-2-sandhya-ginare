"use client";

import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";

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

export function ImportForm({ venueId, timezone }: { venueId: string; timezone: string }) {
  const [kind, setKind] = useState<ImportKind>("sales");
  const [headers, setHeaders] = useState<string[]>([]);
  const [csv, setCsv] = useState("");
  const [filename, setFilename] = useState("upload.csv");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  function readCsv(text: string, name: string, importKind: ImportKind = kind) {
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
  }, [csv, kind, mapping.partySize, mapping.timestamp]);

  const fields = kind === "sales" ? salesFields : reservationFields;
  const mappingIssue = csv ? validateImportMapping(kind, mapping) : null;

  return (
    <form
      className="space-y-8"
      onSubmit={async (event) => {
        event.preventDefault();
        const issue = validateImportMapping(kind, mapping);
        if (issue) {
          setMessage(issue);
          return;
        }
        setPending(true);
        setMessage("");
        const response = await fetch("/api/imports", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ venueId, kind, filename, csv, mapping }),
        });
        const body = (await response.json()) as { message?: string; errors?: string[]; success?: boolean };
        setMessage([body.message, ...(body.errors ?? [])].filter(Boolean).join(" "));
        setPending(false);
      }}
    >
      <div className="flex gap-6 text-[11px] uppercase tracking-[0.18em]">
        <label>
          <input type="radio" name="kind" checked={kind === "sales"} onChange={() => setKind("sales")} /> Sales
        </label>
        <label>
          <input
            type="radio"
            name="kind"
            checked={kind === "reservations"}
            onChange={() => setKind("reservations")}
          />{" "}
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
        className="text-[11px] uppercase tracking-[0.18em] text-accent"
        onClick={async () => {
          const path = kind === "sales" ? "/demo/sales-sample.csv" : "/demo/reservations-sample.csv";
          const text = await fetch(path).then((response) => response.text());
          readCsv(text, path.split("/").pop() ?? "sample.csv", kind);
        }}
      >
        Load the sample file
      </button>
      {headers.length > 0 && (
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
      )}
      {mappingIssue && headers.length > 0 ? (
        <p className="text-sm text-under">{mappingIssue}</p>
      ) : null}
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
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </form>
  );
}
