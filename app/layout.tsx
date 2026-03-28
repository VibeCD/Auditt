import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auditt — Compliance Binder Generator",
  description:
    "Turn messy business notes into professional compliance binders, SOPs, checklists and forms — instantly. No prompts needed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="antialiased min-h-full font-sans">{children}</body>
    </html>
  );
}
