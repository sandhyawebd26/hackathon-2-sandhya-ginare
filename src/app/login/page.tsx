import { LoginForm } from "@/components/ops/auth-forms";
import { AuthShell } from "@/components/ops/auth-shell";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthShell
      kicker="Admin"
      title="Sign in"
      hero={{
        src: "/landing/kitchen-pass.jpg",
        alt: "Plates leaving the kitchen pass",
        label: "Service",
        lead: "Back to the pass.",
      }}
      footer={{ href: "/signup", label: "Create an account" }}
    >
      <LoginForm />
    </AuthShell>
  );
}
