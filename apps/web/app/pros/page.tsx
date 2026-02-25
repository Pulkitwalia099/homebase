"use client";

import { useState } from "react";
import Navbar from "../../components/marketing/Navbar";
import Footer from "../../components/marketing/Footer";
import WaitlistForm from "../../components/marketing/WaitlistForm";

const BENEFITS = [
  {
    title: "Not a lead — a confirmed job",
    description:
      "Every job comes with a guaranteed price, full scoping notes, and customer photos. If you accept, the job is yours.",
  },
  {
    title: "No awkward price talks",
    description:
      "Prices come from our validated taxonomy. Scope changes go through the system — customer approves before you proceed.",
  },
  {
    title: "Same-week payouts",
    description:
      "Get paid via direct deposit within days of job completion. $22 booking fee, that's it.",
  },
];

export default function ProsPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-warm-white">
      <Navbar />

      <main className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-navy">
              Confirmed jobs. Fair prices. Get paid fast.
            </h1>
            <p className="mt-4 text-lg text-navy-light max-w-xl mx-auto">
              HomeBase sends you pre-scoped, pre-priced plumbing jobs.
              Accept with one tap. No lead fees. No bidding wars.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {BENEFITS.map((b) => (
              <div key={b.title} className="p-6 rounded-xl bg-white border border-cool-gray">
                <h3 className="font-bold text-navy mb-2">{b.title}</h3>
                <p className="text-sm text-navy-light leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>

          {/* Job Card Preview */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-navy text-center mb-6">What You See</h2>
            <div className="max-w-sm mx-auto rounded-xl bg-white border border-cool-gray shadow-lg overflow-hidden">
              <div className="bg-amber/10 px-5 py-3 border-b border-cool-gray">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-amber font-medium">PLM-201</span>
                  <span className="text-xs bg-green/20 text-green px-2 py-0.5 rounded-full font-medium">New Job</span>
                </div>
                <h3 className="font-bold text-navy mt-1">Faucet Repair / Replace</h3>
              </div>
              <div className="px-5 py-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-navy-light">Address</span>
                  <span className="text-navy">123 Main St, Boston</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-navy-light">Price</span>
                  <span className="text-navy font-bold">$165.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-navy-light">Duration</span>
                  <span className="text-navy">~60 min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-navy-light">Window</span>
                  <span className="text-navy">Tomorrow 10am–12pm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-navy-light">Customer</span>
                  <span className="text-navy">Alex M.</span>
                </div>
                <div className="pt-2 border-t border-cool-gray">
                  <p className="text-navy-light text-xs font-medium mb-1">Scoping Notes:</p>
                  <p className="text-navy-light text-xs">
                    Kitchen faucet leaking from base when turned on. Single handle. Started yesterday. Likely O-ring or cartridge.
                  </p>
                </div>
              </div>
              <div className="px-5 py-3 border-t border-cool-gray flex gap-3">
                <button className="flex-1 bg-green text-white font-medium py-2.5 rounded-lg text-sm">
                  Accept
                </button>
                <button className="flex-1 border border-cool-gray text-navy-light font-medium py-2.5 rounded-lg text-sm">
                  Decline
                </button>
              </div>
            </div>
          </div>

          {/* Pro Waitlist */}
          <section id="apply" className="scroll-mt-24">
            <div className="max-w-md mx-auto p-6 rounded-xl bg-white border border-cool-gray">
              <h2 className="text-xl font-bold text-navy text-center mb-2">
                Apply to Join
              </h2>
              <p className="text-sm text-navy-light text-center mb-6">
                Licensed plumbers in Greater Boston — join the HomeBase network.
              </p>
              {showForm ? (
                <WaitlistForm type="pro" />
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-amber text-navy font-medium py-2.5 rounded-lg hover:bg-amber/90 transition-colors"
                >
                  Apply Now
                </button>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
