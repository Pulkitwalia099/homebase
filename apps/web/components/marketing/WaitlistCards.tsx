"use client";

import { useState } from "react";
import WaitlistForm from "./WaitlistForm";

const USE_CASE_PILLS = [
  "AI Assistant",
  "Property Mgmt SaaS",
  "Insurance / Warranty",
  "Smart Home / IoT",
  "Real Estate Platform",
];

export default function WaitlistCards() {
  const [activeForm, setActiveForm] = useState<"homeowner" | "pro" | "developer" | null>(null);
  const [prefilledUseCase, setPrefilledUseCase] = useState("");
  const [devHovered, setDevHovered] = useState(false);

  function openDeveloperForm(useCase?: string) {
    setPrefilledUseCase(useCase || "");
    setActiveForm("developer");
  }

  return (
    <section id="waitlist" className="py-24 px-4 sm:px-6 bg-warm-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-medium tracking-widest uppercase text-amber mb-3">
            Get Started
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-navy">
            Join the waitlist.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Homeowner Card */}
          <div className="rounded-2xl bg-white border-l-4 border-l-amber border border-gray-100 p-7 shadow-sm hover:shadow-lg transition-shadow flex flex-col">
            <div className="text-2xl mb-3">🏠</div>
            <h3 className="text-lg font-bold text-navy">Homeowners & Property Managers</h3>
            <ul className="text-sm text-gray-500 mt-3 space-y-2 flex-1">
              <li className="flex items-start gap-2"><span className="text-amber font-bold mt-0.5">&#10003;</span>Guaranteed pricing before you book</li>
              <li className="flex items-start gap-2"><span className="text-amber font-bold mt-0.5">&#10003;</span>Booked in under 2 minutes — no calls, no back-and-forth</li>
              <li className="flex items-start gap-2"><span className="text-amber font-bold mt-0.5">&#10003;</span>No surprises. Ever.</li>
            </ul>
            {activeForm === "homeowner" ? (
              <div className="mt-5">
                <WaitlistForm type="homeowner" onClose={() => setActiveForm(null)} />
              </div>
            ) : (
              <button
                onClick={() => setActiveForm("homeowner")}
                className="mt-5 w-full bg-navy text-white font-medium py-2.5 rounded-lg hover:bg-navy-light transition-colors"
              >
                Join Waitlist
              </button>
            )}
          </div>

          {/* Pro Card */}
          <div className="rounded-2xl bg-white border-l-4 border-l-amber border border-gray-100 p-7 shadow-sm hover:shadow-lg transition-shadow flex flex-col">
            <div className="text-2xl mb-3">🔧</div>
            <h3 className="text-lg font-bold text-navy">Pros & Home Service Businesses</h3>
            <ul className="text-sm text-gray-500 mt-3 space-y-2 flex-1">
              <li className="flex items-start gap-2"><span className="text-amber font-bold mt-0.5">&#10003;</span>Pre-paid jobs, not leads</li>
              <li className="flex items-start gap-2"><span className="text-amber font-bold mt-0.5">&#10003;</span>1/10th the CAC of Google Ads</li>
              <li className="flex items-start gap-2"><span className="text-amber font-bold mt-0.5">&#10003;</span>1/5th the cost of Thumbtack &amp; Angi</li>
            </ul>
            {activeForm === "pro" ? (
              <div className="mt-5">
                <WaitlistForm type="pro" onClose={() => setActiveForm(null)} />
              </div>
            ) : (
              <button
                onClick={() => setActiveForm("pro")}
                className="mt-5 w-full bg-navy text-white font-medium py-2.5 rounded-lg hover:bg-navy-light transition-colors"
              >
                Apply to Join
              </button>
            )}
          </div>

          {/* Developer Card — dark, hover-expand */}
          <div
            className="rounded-2xl bg-[#1A2B4A] p-7 flex flex-col"
            onMouseEnter={() => setDevHovered(true)}
            onMouseLeave={() => setDevHovered(false)}
          >
            <div className="text-2xl mb-3">🤖</div>
            <h3 className="text-lg font-bold text-white">Developers & Platforms</h3>
            <ul className="text-sm text-gray-400 mt-3 space-y-2">
              <li className="flex items-start gap-2"><span className="text-amber font-bold mt-0.5">&#10003;</span>Scope, price, and book in one API call</li>
              <li className="flex items-start gap-2"><span className="text-amber font-bold mt-0.5">&#10003;</span>10x fewer tokens than DIY chains</li>
              <li className="flex items-start gap-2"><span className="text-amber font-bold mt-0.5">&#10003;</span>Sub-second classification, 95%+ accuracy</li>
            </ul>

            {/* Use case pills — visible on hover (desktop) or always (mobile) */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                devHovered ? "max-h-40 opacity-100 mt-4" : "max-h-0 opacity-0 md:max-h-0 md:opacity-0"
              } max-md:max-h-40 max-md:opacity-100 max-md:mt-4`}
            >
              <div className="flex flex-wrap gap-2">
                {USE_CASE_PILLS.map((pill) => (
                  <button
                    key={pill}
                    onClick={() => openDeveloperForm(pill)}
                    className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-gray-300 hover:bg-white/10 transition-colors"
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1" />

            {activeForm === "developer" ? (
              <div className="mt-5 [&_input]:bg-white/10 [&_input]:border-white/10 [&_input]:text-white [&_input]:placeholder-gray-500 [&_select]:bg-white/10 [&_select]:border-white/10 [&_select]:text-white [&_button]:bg-white [&_button]:text-navy [&_p]:text-white">
                <WaitlistForm type="developer" prefilledUseCase={prefilledUseCase} onClose={() => setActiveForm(null)} />
              </div>
            ) : (
              <button
                onClick={() => openDeveloperForm()}
                className="mt-5 w-full bg-white text-navy font-medium py-2.5 rounded-lg hover:bg-white/90 transition-colors"
              >
                Get API Access
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
