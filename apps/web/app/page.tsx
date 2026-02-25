"use client";

import { useState } from "react";
import Navbar from "../components/marketing/Navbar";
import HeroSection from "../components/marketing/HeroSection";
import HowItWorks from "../components/marketing/HowItWorks";
import TaxonomyPreview from "../components/marketing/TaxonomyPreview";
import ApiPreview from "../components/marketing/ApiPreview";
import WaitlistCards from "../components/marketing/WaitlistCards";
import FounderSection from "../components/marketing/FounderSection";
import Footer from "../components/marketing/Footer";
import ViewToggle from "../components/marketing/ViewToggle";
import MachineView from "../components/marketing/MachineView";

export default function Home() {
  const [viewMode, setViewMode] = useState<"human" | "machine">("human");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        name: "HomeBase",
        description:
          "AI-powered plumbing services in Boston. Guaranteed pricing, licensed plumbers, instant booking.",
        url: "https://homebase.ai",
        areaServed: {
          "@type": "City",
          name: "Boston",
          addressRegion: "MA",
          addressCountry: "US",
        },
        serviceType: "Plumbing",
        priceRange: "$$",
      },
      {
        "@type": "WebApplication",
        name: "HomeBase API",
        url: "https://homebase.ai/developers",
        applicationCategory: "BusinessApplication",
        description:
          "Scope, price, and book plumbing services programmatically via API.",
      },
    ],
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      viewMode === "machine" ? "bg-dark" : "bg-warm-white"
    }`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {viewMode === "human" ? (
        <>
          <Navbar showStatusBar />
          <main>
            <HeroSection />
            <HowItWorks />
            <TaxonomyPreview />
            <ApiPreview />
            <WaitlistCards />
            <FounderSection />
          </main>
          <Footer />
          {/* Spacer so toggle doesn't overlap footer */}
          <div className="h-20" />
        </>
      ) : (
        <MachineView />
      )}
      <ViewToggle mode={viewMode} onToggle={setViewMode} />
    </div>
  );
}
