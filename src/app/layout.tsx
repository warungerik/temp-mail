import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TempMail — Disposable Email in One Click",
  description:
    "Get a working temporary email address instantly. No sign-up, no password, no phone. Any name, any domain. Emails arrive in real time.",
  keywords: ["temp mail", "temporary email", "disposable email", "fake email", "email generator"],
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "TempMail — Disposable Email in One Click",
    description: "Get a working temporary email address instantly. No sign-up, no password, no phone.",
    type: "website",
    images: [{ url: "/logo-512.webp", width: 512, height: 512, alt: "TempMail" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
