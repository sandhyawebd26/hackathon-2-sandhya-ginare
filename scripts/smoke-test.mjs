#!/usr/bin/env node
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3010";

async function req(path, { method = "GET", body, cookie } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (cookie) headers.Cookie = cookie;
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text.slice(0, 200), status: response.status };
  }
  return { status: response.status, json, headers: response.headers };
}

function pickCookie(setCookie) {
  if (!setCookie) return "";
  const parts = setCookie.split(";")[0];
  return parts;
}

async function main() {
  const email = `smoke-${Date.now()}@example.com`;
  const password = "testpass123";
  const results = [];

  const signup = await req("/api/auth/signup", {
    method: "POST",
    body: {
      name: "Smoke Test",
      email,
      password,
      businessType: "restaurant",
      venueName: "Smoke House",
      city: "Mumbai",
      countryCode: "IN",
    },
  });
  const cookie = pickCookie(signup.headers.get("set-cookie"));
  const venueId = signup.json?.data?.venueId;
  results.push(["signup", signup.json.success, venueId]);

  const authed = (path, opts = {}) => req(path, { ...opts, cookie });

  for (const path of ["/api/forecast", "/api/staffing/matrix", "/api/alerts"]) {
    const r = await authed(path);
    results.push([path, r.json.success, r.status]);
  }

  const event = await authed("/api/events", {
    method: "POST",
    body: { venueId, note: "Wedding of 80 on Saturday at 8pm" },
  });
  results.push(["events (note)", event.json.success]);

  const matrix = await authed("/api/staffing/matrix");
  const recId = matrix.json?.data?.cells?.[0]?.id;
  results.push(["staffing cells", matrix.json?.data?.cells?.length ?? 0]);

  const explain = await authed("/api/ai/explain", {
    method: "POST",
    body: { recommendationId: recId },
  });
  results.push(["ai explain", explain.json.success, explain.json?.data?.source]);

  const accept = await authed(`/api/recommendations/${recId}/action`, {
    method: "POST",
    body: { action: "accepted" },
  });
  results.push(["rec accepted", accept.json.success]);

  const forecastRun = await authed("/api/forecast/run", {
    method: "POST",
    body: { venueId },
  });
  results.push(["forecast run", forecastRun.json.success]);

  const roster = await authed("/api/roster/build", {
    method: "POST",
    body: { venueId },
  });
  results.push(["roster build", roster.json.success, roster.json?.data?.shifts]);

  const csv = await fetch(`${BASE}/demo/sales-sample.csv`).then((r) => r.text());
  const imp = await authed("/api/imports", {
    method: "POST",
    body: {
      venueId,
      kind: "sales",
      filename: "sales-sample.csv",
      csv,
      mapping: {
        timestamp: "timestamp",
        covers: "covers",
        orders: "orders",
        value: "value",
        channel: "channel",
      },
    },
  });
  results.push(["import sales", imp.json.success, imp.json.message?.slice(0, 40)]);

  const rolesPost = await authed("/api/roles", { method: "POST", body: { venueId } });
  results.push(["roles POST empty", rolesPost.status, rolesPost.json.success]);

  await authed("/api/auth/logout", { method: "POST" });
  const noAuth = await req("/api/forecast");
  results.push(["forecast no cookie", noAuth.json.success, noAuth.json.message?.slice(0, 30)]);

  const cron = await req("/api/cron/forecast-nightly");
  results.push(["cron nightly", cron.json.success, cron.json?.data?.venues]);

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
