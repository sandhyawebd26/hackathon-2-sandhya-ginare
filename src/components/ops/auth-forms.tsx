"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { COUNTRIES } from "@/lib/countries";

const field = "mt-2 w-full border-b border-border bg-transparent py-2 text-base tracking-normal normal-case";

export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mt-8 space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage("");
        const form = new FormData(event.currentTarget);
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          }),
        });
        const body = (await response.json()) as { success?: boolean; message?: string };
        setPending(false);
        if (!body.success) {
          setMessage(body.message ?? "Could not sign in");
          return;
        }
        router.push("/dashboard");
        router.refresh();
      }}
    >
      <label className="block text-[11px] uppercase tracking-[0.18em]">
        Email
        <input name="email" type="email" required className={field} />
      </label>
      <label className="block text-[11px] uppercase tracking-[0.18em]">
        Password
        <PasswordField autoComplete="current-password" />
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in" : "Sign in"}
      </Button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </form>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mt-8 grid gap-5 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage("");
        const form = new FormData(event.currentTarget);
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: String(form.get("name") ?? ""),
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
            businessType: String(form.get("businessType") ?? "restaurant"),
            venueName: String(form.get("venueName") ?? ""),
            city: String(form.get("city") ?? ""),
            countryCode: String(form.get("countryCode") ?? ""),
          }),
        });
        const body = (await response.json()) as { success?: boolean; message?: string };
        setPending(false);
        if (!body.success) {
          setMessage(body.message ?? "Could not create the account");
          return;
        }
        router.push("/dashboard");
        router.refresh();
      }}
    >
      <label className="block text-[11px] uppercase tracking-[0.18em]">
        Your name
        <input name="name" required className={field} />
      </label>
      <label className="block text-[11px] uppercase tracking-[0.18em]">
        Work email
        <input name="email" type="email" required className={field} />
      </label>
      <label className="block text-[11px] uppercase tracking-[0.18em]">
        Password
        <PasswordField minLength={8} autoComplete="new-password" />
      </label>
      <label className="block text-[11px] uppercase tracking-[0.18em]">
        Business
        <select name="businessType" defaultValue="restaurant" className="menu mt-2">
          <option value="hotel">Hotel</option>
          <option value="restaurant">Restaurant</option>
          <option value="cafe">Café</option>
        </select>
      </label>
      <label className="block text-[11px] uppercase tracking-[0.18em]">
        Venue name
        <input name="venueName" required className={field} />
      </label>
      <label className="block text-[11px] uppercase tracking-[0.18em]">
        City
        <input name="city" required className={field} />
      </label>
      <label className="block text-[11px] uppercase tracking-[0.18em] md:col-span-2">
        Country
        <select name="countryCode" required defaultValue="" className="menu mt-2">
          <option value="" disabled>
            Select a country
          </option>
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </label>
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating the house" : "Create account"}
        </Button>
        {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
      </div>
    </form>
  );
}
