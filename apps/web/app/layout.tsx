import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-dm-sans" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains" });
export const metadata: Metadata = {
  metadataBase: new URL("https://getgolocal.com"),
  title: { default: "GoLocal — Local services, ready for the agent era", template: "%s | GoLocal" },
  description: "GoLocal connects personal AI agents with participating local businesses. Register your business, become an agent partner, or bring your network as a channel partner.",
  openGraph: { type: "website", siteName: "GoLocal", locale: "en_US", title: "GoLocal — Local services, ready for the agent era", description: "One connection between personal AI agents and the local businesses that get things done." },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/brand/golocal-symbol.png", apple: "/brand/golocal-symbol.png" },
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={`${dmSans.variable} ${jetBrainsMono.variable} font-sans antialiased`}>{children}</body></html>; }
