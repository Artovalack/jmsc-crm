import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "JMSC Studio Desk",
    template: "%s · JMSC Studio Desk",
  },
  description: "Creative operations and client management for JMSC Media Works.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
