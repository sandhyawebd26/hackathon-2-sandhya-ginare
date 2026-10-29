"use client";

import Papa from "papaparse";
import { useState } from "react";

import { Button } from "@/components/ui/button";

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

export function ImportForm({ venueId }: { venueId: string }) {
  const [kind, setKind] = useState<"sales" | "reservations">("sales");
  const [headers, setHeaders] = useState<string[]>([]);
  const [csv, setCsv] = useState("");
  const [filename, setFilename] = useState("upload.csv");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  function readCsv(text: string, name: string) {
    setCsv(text);
    setFilename(name);
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, preview: 1, skipEmptyLines: true });
    const fields = parsed.meta.fields?.filter(Boolean) ?? [];
    setHeaders(fields);
    const next: Record<string, string> = {};
    for (const field of fields) {
      const lower = field.toLowerCase();
      if (lower.includes("date") || lower.includes("time")) next.timestamp = field;
      if (lower.includes("cover")) next.covers = field;
      if (lower.includes("order")) next.orders = field;
      if (lower.includes("value") || lower.includes("amount")) next.value = field;
      if (lower.includes("channel")) next.channel = field;
      if (lower.includes("party")) next.partySize = field;
      if (lower.includes("status")) next.status = field;
      if (lower.includes("source")) next.source = field;
    }
    setMapping(next);
  }

  const fields = kind === "sales" ? salesFields : reservationFields;

  return (
    <form
      className="space-y-8"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage("");
        const response = await fetch("/api/imports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ venueId, kind, filename, csv, mapping }),
        });
        const body = (await response.json()) as { message?: string; errors?: string[] };
        setMessage([body.message, ...(body.errors ?? [])].filter(Boolean).join(" "));
        setPending(false);
      }}
    >
      <div className="flex gap-6 text-[11px] uppercase tracking-[0.18em]">
        <label>
          <input type="radio" name="kind" checked={kind === "sales"} onChange={() => setKind("sales")} /> Sales
        </label>
        <label>
          <input type="radio" name="kind" checked={kind === "reservations"} onChange={() => setKind("reservations")} /> Reservations
        </label>
      </div>
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
          readCsv(text, path.split("/").pop() ?? "sample.csv");
        }}
      >
        Load the sample file
      </button>
      {headers.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map(([key, label]) => (
            <label key={key} className="text-[11px] uppercase tracking-[0.18em]">
              {label}
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
      <Button type="submit" disabled={pending || !csv || !mapping.timestamp}>
        {pending ? "Importing" : "Import and recalculate"}
      </Button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </form>
  );
}
