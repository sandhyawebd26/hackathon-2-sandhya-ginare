"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function RebuildRoster({ venueId }: { venueId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className="mb-8 flex flex-wrap items-center gap-4">
      <Button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setMessage("");
          const response = await fetch("/api/roster/build", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ venueId }),
          });
          const body = (await response.json()) as { success?: boolean; message?: string };
          setMessage(body.message ?? "");
          setPending(false);
          if (body.success) router.refresh();
        }}
      >
        {pending ? "Building" : "Rebuild this week"}
      </Button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
