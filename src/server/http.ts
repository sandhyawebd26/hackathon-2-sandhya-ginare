export function ok(data: unknown, message?: string) {
  return Response.json({ success: true, data, message });
}

export function fail(message: string, status = 400, errors: string[] = []) {
  return Response.json({ success: false, message, errors }, { status });
}

export function assertCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") return fail("CRON_SECRET is not configured", 401);
    return null;
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return fail("Unauthorized", 401);
  return null;
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new Error("Expected a JSON body");
  }
}
