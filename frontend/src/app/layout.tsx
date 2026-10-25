import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Post an Event Requirement",
  description: "Find event planners, performers and crew by posting what your event needs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">✦</span>
              EventHire
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/requirements" className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                Browse
              </Link>
              <Link href="/post" className="rounded-lg bg-violet-600 px-3 py-2 font-medium text-white hover:bg-violet-700">
                Post requirement
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          Built with Next.js, Express &amp; MongoDB
        </footer>
      </body>
    </html>
  );
}
