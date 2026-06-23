import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import "./globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

/* =========================
   FONT
========================= */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

/* =========================
   SEO
========================= */
export const metadata: Metadata = {
  title: "JetlyXO – Plan Your Perfect Journey",
  description:
    "Book flights, trains and hotels instantly with JetlyXO. Smart travel planning with secure booking flow.",
  keywords:
    "JetlyXO, travel booking, flights, trains, hotels, cheap flights, Razorpay travel booking",
  openGraph: {
    title: "JetlyXO – Plan Your Perfect Journey",
    description:
      "Book flights, trains and hotels instantly with JetlyXO.",
    type: "website",
  },
};

/* =========================
   ROOT LAYOUT
========================= */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${inter.className} min-h-screen bg-slate-950 text-white`}
      >
        {/* Razorpay */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />

        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="min-h-screen">{children}</main>

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}