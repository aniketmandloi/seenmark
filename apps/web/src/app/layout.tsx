import type { Metadata, Viewport } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";

import "../index.css";
import Header from "@/components/header";
import Providers from "@/components/providers";
import SiteFooter from "@/components/site-footer";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Seenmark | Your hairline, over time",
    template: "%s | Seenmark",
  },
  description:
    "Keep private hairline check-ins, compare them over time, and choose a next step that feels right to you.",
  openGraph: {
    title: "Seenmark | Your hairline, over time",
    description: "A private record of your hairline check-ins and the next step you choose.",
    type: "website",
    locale: "en_US",
  },
};

// Matches the light and dark --background tokens so mobile browser chrome blends into the page.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFBF4" },
    { media: "(prefers-color-scheme: dark)", color: "#0A140F" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <div className="flex min-h-dvh flex-col">
            <Header />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
