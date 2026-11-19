import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource-variable/source-serif-4";
import "katex/dist/katex.min.css";
import "./globals.css";


export const metadata: Metadata = {
  title: { default: "TCS Study", template: "%s · TCS Study" },
  description: "Short, self-checking practice for Theoretical Computer Science I.",
  applicationName: "TCS Study",
  appleWebApp: { capable: true, title: "TCS Study", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f6f1" },
    { media: "(prefers-color-scheme: dark)", color: "#131312" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4">
          <header className="flex items-center justify-between py-4">
            <Link href="/" className="font-serif text-lg font-semibold tracking-tight">
              TCS Study
            </Link>
            <nav className="flex gap-4 text-sm text-muted">
              <Link href="/practice/mistakes">Mistakes</Link>
              <Link href="/data">Your data</Link>
            </nav>
          </header>
          <main className="flex-1 pb-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
