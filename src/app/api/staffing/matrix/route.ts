import { fail, ok } from "@/server/http";
import { loadStaffing } from "@/server/queries";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const data = await loadStaffing(
      url.searchParams.get("venueId") ?? undefined,
      url.searchParams.get("date") ?? undefined,
    );
    return ok(data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not load staffing", 400);
  }
}
