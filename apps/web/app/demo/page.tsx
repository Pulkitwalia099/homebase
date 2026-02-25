"use client";

import { useState } from "react";
import Navbar from "../../components/marketing/Navbar";
import Footer from "../../components/marketing/Footer";
import DemoChat from "../../components/marketing/DemoChat";
import { scenarios, type DemoScenario } from "../../lib/demo-scenarios";

export default function DemoPage() {
  const [activeScenario, setActiveScenario] = useState<DemoScenario | null>(null);

  return (
    <div className="min-h-screen bg-warm-white">
      <Navbar />

      <main className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-navy">Try HomeBase</h1>
            <p className="mt-3 text-lg text-navy-light max-w-xl mx-auto">
              Describe a plumbing problem. Watch it get scoped, priced, and matched in real-time.
            </p>
          </div>

          {!activeScenario ? (
            <>
              {/* Scenario cards */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {scenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveScenario(s)}
                    className="text-left p-5 rounded-xl border border-cool-gray bg-white hover:border-amber/50 hover:shadow-md transition-all"
                  >
                    <span className="text-2xl">{s.emoji}</span>
                    <h3 className="mt-2 font-bold text-navy">{s.title}</h3>
                    <p className="text-sm text-navy-light mt-1">{s.subtitle}</p>
                  </button>
                ))}
              </div>

              {/* Free-form input (UI only) */}
              <div className="rounded-xl border border-cool-gray bg-white p-4">
                <p className="text-sm text-navy-light mb-3">Or describe your own issue:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. My water heater is making weird noises..."
                    className="flex-1 px-3 py-2 rounded-lg border border-cool-gray text-sm focus:outline-none focus:ring-2 focus:ring-amber/50"
                    disabled
                  />
                  <button
                    disabled
                    className="px-4 py-2 bg-cool-gray text-navy-light rounded-lg text-sm cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="max-w-lg mx-auto">
              {/* Back button */}
              <button
                onClick={() => setActiveScenario(null)}
                className="mb-4 text-sm text-navy-light hover:text-navy transition-colors"
              >
                ← Choose a different scenario
              </button>
              <DemoChat scenario={activeScenario} onReset={() => setActiveScenario(null)} />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
