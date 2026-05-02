import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Recall Trial",
  description:
    "A Chrome extension where ancient philosophers judge your YouTube Shorts doomscrolling."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
