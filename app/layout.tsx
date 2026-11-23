import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PublicOnly from "./components/PublicOnly";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = { themeColor: "#0b0b0b" };

export const metadata: Metadata = {
  title: "Prostyle Sports Wear — Coming Soon",
  description: "Performance sportswear from Prostyle. Launching soon.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* PublicOnly reads the current path, which must sit inside Suspense with Cache Components. */}
        <Suspense fallback={null}>
          <PublicOnly>
            <Header />
          </PublicOnly>
        </Suspense>
        {children}
        <Suspense fallback={null}>
          <PublicOnly>
            <Footer />
          </PublicOnly>
        </Suspense>
      </body>
    </html>
  );
}
