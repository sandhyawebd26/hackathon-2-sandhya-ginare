import { validateImportMapping } from "@/lib/csv-mapping";
import { importRows, importSchema } from "@/server/ingestion/csv";
import { syncDemoSessionBundle, warmDemoSessionFromCookies } from "@/server/auth/session";
import { fail, formatError, ok, readJson } from "@/server/http";
import { replan } from "@/server/pipeline";
import { resolveVenue } from "@/server/queries";

export async function POST(request: Request) {
  try {
    const input = importSchema.parse(await readJson(request));
    await warmDemoSessionFromCookies();
    const mappingError = validateImportMapping(input.kind, input.mapping);
    if (mappingError) return fail(mappingError, 422);
    const { store, venue, account } = await resolveVenue(input.venueId);
    if (venue.id !== input.venueId) return fail("Venue not found", 404);
    const imported = importRows(venue, input);
    const count = input.kind === "sales" ? imported.sales.length : imported.reservations.length;
    if (!count) return fail("No rows could be imported", 422, imported.errors);
    let storagePath: string | undefined;
    if (store.saveImportFile) {
      storagePath = await store.saveImportFile(venue.id, input.filename, input.csv);
    }
    if (input.kind === "sales") await store.insertSales(imported.sales);
    else await store.insertReservations(imported.reservations);
    const job = await store.createImportJob({
      id: crypto.randomUUID(),
      venueId: venue.id,
      filename: input.filename,
      kind: input.kind,
      mapping: Object.fromEntries(
        Object.entries(input.mapping).filter((entry): entry is [string, string] => Boolean(entry[1])),
      ),
      status: imported.errors.length ? "completed_with_warnings" : "completed",
      rowCount: count,
      errors: imported.errors,
      storagePath,
      createdAt: new Date().toISOString(),
    });
    await replan(store, venue);
    await syncDemoSessionBundle(store, account, venue);
    return ok(job, `Imported ${count} rows`);
  } catch (error) {
    return fail(formatError(error), 400);
  }
}
