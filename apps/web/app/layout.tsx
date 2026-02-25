import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://homebase.ai"),
  title: {
    default: "HomeBase — Plumbing Services in Boston | AI-Powered Booking",
    template: "%s | HomeBase",
  },
  description:
    "Book trusted, licensed plumbers in Boston with guaranteed pricing. AI agents scope your issue, provide an instant quote, and match you with a vetted pro. No surprises.",
  keywords: [
    "plumber Boston",
    "plumbing services Boston",
    "Boston plumber",
    "licensed plumber Boston MA",
    "emergency plumber Boston",
    "plumbing repair Boston",
    "guaranteed price plumbing",
    "book a plumber online",
    "AI home services",
    "home services API",
    "plumbing quote Boston",
    "pipe leak repair Boston",
    "faucet repair Boston",
    "water heater repair Boston",
  ],
  openGraph: {
    type: "website",
    siteName: "HomeBase",
    locale: "en_US",
    title: "HomeBase — Plumbing Services in Boston | AI-Powered Booking",
    description:
      "Book trusted, licensed plumbers in Boston with guaranteed pricing. AI-powered scoping, instant quotes, vetted pros.",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${jetBrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
