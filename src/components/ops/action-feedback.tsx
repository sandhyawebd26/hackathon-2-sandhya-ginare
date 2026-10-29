export type ActionFeedbackState = { tone: "success" | "error"; text: string } | null;

export function ActionFeedback({ feedback }: { feedback: ActionFeedbackState }) {
  if (!feedback?.text) return null;
  return (
    <p
      role="status"
      aria-live="polite"
      className={`text-sm ${feedback.tone === "success" ? "text-accent" : "text-under"}`}
    >
      {feedback.text}
    </p>
  );
}

export function feedbackFromResponse(
  body: { success?: boolean; message?: string; errors?: string[] },
  fallbacks: { success: string; error: string },
): ActionFeedbackState {
  if (body.success) {
    return { tone: "success", text: body.message?.trim() || fallbacks.success };
  }
  const detail = [body.message, ...(body.errors ?? [])].filter(Boolean).join(" ");
  return { tone: "error", text: detail || fallbacks.error };
}
