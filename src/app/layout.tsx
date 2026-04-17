import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DealsProvider } from "@/providers/deals-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Converis AI · Local PMI Platform",
  description:
    "Privacy-first, local-only post-merger integration platform powered by Ollama.",
  icons: {
    icon: "/converis-logo.png",
    apple: "/converis-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-black font-sans antialiased`}
      >
        <DealsProvider>{children}</DealsProvider>
      </body>
    </html>
  );
}
