import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function Home() {
  const configured = hasSupabaseEnv();
  let authStatus: "signed_in" | "signed_out" | "unconfigured" = "unconfigured";

  if (configured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authStatus = user ? "signed_in" : "signed_out";
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 font-sans dark:bg-black">
      <main className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Hackathon starter
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Next.js + Supabase
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          TypeScript App Router project with Supabase SSR clients and session
          refresh middleware.
        </p>

        <dl className="mt-8 space-y-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-600 dark:text-zinc-400">Supabase env</dt>
            <dd className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
              {configured ? "configured" : "missing (.env.local)"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-600 dark:text-zinc-400">Auth (server)</dt>
            <dd className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
              {authStatus === "unconfigured"
                ? "n/a"
                : authStatus === "signed_in"
                  ? "signed in"
                  : "signed out"}
            </dd>
          </div>
        </dl>

        {!configured && (
          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
            Copy{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono dark:bg-zinc-800">
              .env.local.example
            </code>{" "}
            to{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono dark:bg-zinc-800">
              .env.local
            </code>{" "}
            and set your project URL and anon key from the Supabase dashboard.
          </p>
        )}

        <ul className="mt-8 list-inside list-disc space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <li>
            Browser client:{" "}
            <code className="font-mono text-zinc-800 dark:text-zinc-200">
              src/lib/supabase/client.ts
            </code>
          </li>
          <li>
            Server client:{" "}
            <code className="font-mono text-zinc-800 dark:text-zinc-200">
              src/lib/supabase/server.ts
            </code>
          </li>
        </ul>
      </main>
    </div>
  );
}
