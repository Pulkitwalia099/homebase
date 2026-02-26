"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/marketing/Navbar";
import Footer from "../../components/marketing/Footer";
import { scenarios } from "../../lib/demo-scenarios";

export default function DemoPage() {
  const router = useRouter();
  const [customIssue, setCustomIssue] = useState("");

  const goToChat = (message: string) => {
    // Clear any existing chat so we start fresh with the prefilled message
    try { localStorage.removeItem("homebase_chat"); } catch { /* ignore */ }
    sessionStorage.setItem("hb_prefill", message);
    router.push("/chat");
  };

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

          {/* Scenario cards */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => goToChat(s.messages[0].content)}
                className="text-left p-5 rounded-xl border border-cool-gray bg-white hover:border-amber/50 hover:shadow-md transition-all"
              >
                <span className="text-2xl">{s.emoji}</span>
                <h3 className="mt-2 font-bold text-navy">{s.title}</h3>
                <p className="text-sm text-navy-light mt-1">{s.subtitle}</p>
              </button>
            ))}
          </div>

          {/* Free-form input */}
          <div className="rounded-xl border border-cool-gray bg-white p-4">
            <p className="text-sm text-navy-light mb-3">Or describe your own issue:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customIssue}
                onChange={(e) => setCustomIssue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customIssue.trim()) goToChat(customIssue.trim());
                }}
                placeholder="e.g. My water heater is making weird noises..."
                className="flex-1 px-3 py-2 rounded-lg border border-cool-gray text-sm focus:outline-none focus:ring-2 focus:ring-amber/50"
              />
              <button
                onClick={() => customIssue.trim() && goToChat(customIssue.trim())}
                disabled={!customIssue.trim()}
                className="px-4 py-2 bg-navy text-white rounded-lg text-sm hover:bg-navy-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Start Chat →
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
