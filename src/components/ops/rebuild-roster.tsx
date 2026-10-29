"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionFeedback, feedbackFromResponse, type ActionFeedbackState } from "@/components/ops/action-feedback";
import { Button } from "@/components/ui/button";

export function RebuildRoster({ venueId }: { venueId: string }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<ActionFeedbackState>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="mb-8 flex flex-wrap items-center gap-4">
      <Button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setFeedback(null);
          const response = await fetch("/api/roster/build", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ venueId }),
          });
          const body = (await response.json()) as { success?: boolean; message?: string };
          setFeedback(
            feedbackFromResponse(body, {
              success: "Roster rebuilt.",
              error: "Could not rebuild the roster.",
            }),
          );
          setPending(false);
          if (body.success) router.refresh();
        }}
      >
        {pending ? "Building" : "Rebuild this week"}
      </Button>
      <ActionFeedback feedback={feedback} />
    </div>
  );
}
