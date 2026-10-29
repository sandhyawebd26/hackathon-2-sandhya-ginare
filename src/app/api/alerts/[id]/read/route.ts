import { fail, ok } from "@/server/http";
import { getStore } from "@/server/store/supabase";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const store = await getStore();
    await store.markAlertRead(id);
    return ok({ id });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Could not update the alert", 400);
  }
}
