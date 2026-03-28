import type { Metadata } from "next";
import "./globals.css";
import { ThemeToggle } from "@/components/ThemeToggle";

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
      <body className="antialiased min-h-full font-sans app-bg app-text">
        <div className="fixed top-3 right-3 z-50" aria-label="Theme controls">
          <ThemeToggle />
        </div>
        {children}
      </body>
    </html>
  );
}
