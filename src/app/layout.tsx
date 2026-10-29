import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";

import { themeBootScript } from "@/lib/utils";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: {
    default: "ShiftSense",
    template: "%s · ShiftSense",
  },
  description: "AI workforce planning for restaurants, cafés, and hotels.",
  applicationName: "ShiftSense",
  manifest: "/site.webmanifest",
  icons: {
    icon: [{ url: "/shiftsense-icon.svg", type: "image/svg+xml" }],
    shortcut: ["/shiftsense-icon.svg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeBootScript() }} />
        {children}
      </body>
    </html>
  );
}
