import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-dm-sans" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains" });
export const metadata: Metadata = {
  metadataBase: new URL("https://getgolocal.com"),
  title: { default: "GoLocal — Your AI agent, connected to local services", template: "%s | GoLocal" },
  description: "Connect your personal AI agent to local services. GoLocal gives agents a way to find, book and manage local work, and businesses a new customer growth channel.",
  openGraph: { type: "website", siteName: "GoLocal", locale: "en_US", title: "GoLocal — Your AI agent, connected to local services", description: "Your AI agent, connected to the real world. One GoLocal connection to local-service discovery and booking." },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/brand/golocal-symbol.png", apple: "/brand/golocal-symbol.png" },
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={`${dmSans.variable} ${jetBrainsMono.variable} font-sans antialiased`}>{children}</body></html>; }
