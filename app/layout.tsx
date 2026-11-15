import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WebsiteJsonLd } from "@/components/JsonLd";
import { BackToTop } from "@/components/fx/BackToTop";
import { getBaseUrl, SITE_DESCRIPTION } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const TITLE =
  "GC Reviews — Restaurants, Hotels & Entertainment on the Gold Coast";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: TITLE,
    template: "%s | GC Reviews",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: "GC Reviews",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport = { themeColor: "#0d9488" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="grain flex min-h-full flex-col bg-slate-50">
        <WebsiteJsonLd />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <BackToTop />
      </body>
    </html>
  );
}
