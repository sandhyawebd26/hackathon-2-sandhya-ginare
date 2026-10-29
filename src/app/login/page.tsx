import { LoginForm } from "@/components/ops/auth-forms";
import { AuthShell } from "@/components/ops/auth-shell";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthShell
      kicker="Admin"
      title="Sign in"
      hero={{
        src: "/staff/team-briefing.jpg",
        alt: "Service team briefing before the shift",
        label: "Your team",
        lead: "Back to the floor.",
      }}
      footer={{ href: "/signup", label: "Create an account" }}
    >
      <LoginForm />
    </AuthShell>
  );
}
