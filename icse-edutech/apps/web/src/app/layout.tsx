import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Crestline — Science & Maths for Secondary Students",
  description:
    "Master Science and Maths with structured walkthroughs, step-by-step guides, and practice MCQs. Aligned with IGCSE, O-level, and equivalent curricula worldwide.",
  keywords: ["IGCSE", "O-level", "secondary school", "science", "maths", "edutech", "Crestline"],
  openGraph: {
    title: "Crestline — Climb to the Top",
    description:
      "Structured guides, expert tips, and practice questions for secondary school Science & Maths.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Navbar />
        <main className="max-w-[420px] sm:max-w-[640px] lg:max-w-[1100px] mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-10">
          {children}
        </main>
        <footer className="hidden sm:block border-t border-surface-border py-6 mt-10">
          <div className="max-w-[1100px] mx-auto px-6 flex items-center justify-between text-xs text-muted">
            <span>&copy; {new Date().getFullYear()} Crestline</span>
            <span>Science &amp; Maths · Secondary School · Worldwide</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
