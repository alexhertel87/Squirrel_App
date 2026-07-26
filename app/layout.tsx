import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Squirrel! Dashboard",
  description:
    "A calmer dashboard for tasks, meds, school, calendars, search, and sensory-friendly settings.",
  icons: {
    icon: "/squirrel_logo.png",
    shortcut: "/squirrel_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
