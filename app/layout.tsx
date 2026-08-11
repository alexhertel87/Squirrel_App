import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Squirrel!",
  description:
    "An external brain for tasks, meds, school, calendars, files, and all the things you were definitely going to remember.",
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
