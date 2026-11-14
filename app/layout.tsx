import type { Metadata } from "next";
import { PwaRegistration } from "./PwaRegistration";
import "./globals.css";

export const metadata: Metadata = {
  title: "Squirrel!",
  description:
    "A private organizer for tasks, medications, school, calendars, files, and reminders.",
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
      <body><PwaRegistration />{children}</body>
    </html>
  );
}
