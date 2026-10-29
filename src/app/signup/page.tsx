import { SignupForm } from "@/components/ops/auth-forms";
import { AuthShell } from "@/components/ops/auth-shell";

export const metadata = { title: "Create account" };

const hospitalityGallery = [
  {
    src: "/landing/hotel-lobby.jpg",
    alt: "A quiet hotel lobby in morning light",
    label: "Hotel",
  },
  {
    src: "/landing/restaurant-service.jpg",
    alt: "A dining table set for service",
    label: "Restaurant",
  },
  {
    src: "/staff/team-line.jpg",
    alt: "Kitchen and floor staff before service",
    label: "Team",
  },
];

export default function SignupPage() {
  return (
    <AuthShell
      kicker="Admin"
      title="Open your house."
      description="Choose hotel, restaurant, or café. Restaurants start with a full kitchen and floor roster. Hotels and cafés start with a shorter team you can edit."
      gallery={hospitalityGallery}
      wide
      footer={{ href: "/login", label: "Already have an account" }}
    >
      <SignupForm />
    </AuthShell>
  );
}
