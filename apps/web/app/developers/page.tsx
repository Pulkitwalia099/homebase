"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../../components/marketing/Navbar";
import Footer from "../../components/marketing/Footer";
import WaitlistForm from "../../components/marketing/WaitlistForm";

const ENDPOINTS = [
  { method: "POST", path: "/scoping/start", description: "Start a scoping session" },
  { method: "POST", path: "/scoping/{id}/message", description: "Continue conversation" },
  { method: "POST", path: "/quotes/generate", description: "Generate quote from session" },
  { method: "POST", path: "/bookings/create", description: "Book a pro" },
  { method: "GET", path: "/taxonomy/job-codes", description: "List all job codes" },
  { method: "GET", path: "/taxonomy/job-codes/{code}", description: "Get single job code details" },
];

const STEPS = [
  { step: 1, title: "Get an API key", description: "Join the waitlist below — we'll email you credentials." },
  { step: 2, title: "Scope a job", description: "POST /scoping/start with a description and address." },
  { step: 3, title: "Get a quote", description: "POST /quotes/generate with the session ID." },
  { step: 4, title: "Book", description: "POST /bookings/create with customer details and time window." },
];

export default function DevelopersPage() {
  const [showWaitlist, setShowWaitlist] = useState(false);

  return (
    <div className="min-h-screen bg-dark text-gray-300">
      <Navbar variant="dark" />

      <main className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-white">
              Build with the HomeBase API
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-xl mx-auto">
              Scope, price, and book home services programmatically.
              Three API calls from problem to confirmed booking.
            </p>
            <a
              href="#waitlist"
              className="inline-flex items-center mt-6 bg-amber text-navy font-medium px-6 py-3 rounded-lg hover:bg-amber/90 transition-colors"
            >
              Join Waitlist for API Access
            </a>
          </div>

          {/* Quick Start */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6">Quick Start</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {STEPS.map((s) => (
                <div key={s.step} className="p-4 rounded-xl bg-dark-card border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-full bg-amber/20 text-amber flex items-center justify-center font-bold text-sm">
                      {s.step}
                    </span>
                    <h3 className="font-bold text-white">{s.title}</h3>
                  </div>
                  <p className="text-sm text-gray-400 font-mono">{s.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Endpoints Reference */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6">Endpoints Reference</h2>
            <p className="text-sm text-gray-500 font-mono mb-4">Base URL: https://api.homebase.ai/v1</p>
            <div className="overflow-x-auto rounded-xl border border-gray-700">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-700 bg-dark-card">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Method</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Endpoint</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {ENDPOINTS.map((ep) => (
                    <tr key={ep.path} className="border-b border-gray-700/50 last:border-b-0">
                      <td className="py-3 px-4">
                        <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
                          ep.method === "POST" ? "bg-amber/20 text-amber" : "bg-green/20 text-green"
                        }`}>
                          {ep.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-300">{ep.path}</td>
                      <td className="py-3 px-4 text-gray-400">{ep.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Integration Options */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6">Integration Options</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-dark-card border border-gray-700">
                <h3 className="font-bold text-white mb-2">REST API</h3>
                <p className="text-sm text-gray-400">
                  Python & TypeScript SDKs coming soon. Use the REST API directly for now.
                </p>
              </div>
              <div className="p-5 rounded-xl bg-dark-card border border-gray-700">
                <h3 className="font-bold text-white mb-2">MCP Server</h3>
                <p className="text-sm text-gray-400 mb-3">
                  For Claude Desktop, Cursor, and other MCP clients.
                </p>
                <pre className="text-xs font-mono text-green/80 bg-dark p-3 rounded-lg overflow-x-auto">
{`{
  "mcpServers": {
    "homebase": {
      "url": "https://mcp.homebase.ai/sse"
    }
  }
}`}
                </pre>
                <span className="inline-block mt-2 text-xs text-amber">Coming Soon</span>
              </div>
              <div className="p-5 rounded-xl bg-dark-card border border-gray-700">
                <h3 className="font-bold text-white mb-2">Agent Skill</h3>
                <p className="text-sm text-gray-400 mb-2">
                  Point your agent at our skill file for instant integration.
                </p>
                <Link href="/skill.md" className="text-sm font-mono text-green hover:underline">
                  /skill.md →
                </Link>
              </div>
            </div>
          </section>

          {/* Who's Building With HomeBase */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-3">Who&apos;s Building With HomeBase</h2>
            <p className="text-sm text-gray-400 mb-6">
              Any platform where users encounter home service problems can plug into our API.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  icon: "🤖",
                  title: "AI Assistants",
                  description: "ChatGPT, Claude, Gemini — let your assistant scope, price, and book plumbing jobs for users in natural language.",
                },
                {
                  icon: "🏢",
                  title: "Property Management SaaS",
                  description: "Tenants report issues, your platform auto-scopes and books a vetted pro. No phone calls, no guesswork.",
                },
                {
                  icon: "🛡️",
                  title: "Insurance & Home Warranty",
                  description: "Automate claim-to-repair. Our taxonomy standardizes job classification for instant dispatch and pricing.",
                },
                {
                  icon: "🏠",
                  title: "Smart Home / IoT",
                  description: "Leak sensor triggers? Auto-scope the issue from device data and book emergency repair — no human needed.",
                },
                {
                  icon: "🏡",
                  title: "Real Estate Platforms",
                  description: "Pre-sale inspections, move-in repairs, closing checklists — embed guaranteed-price services into your workflow.",
                },
                {
                  icon: "💬",
                  title: "Customer Support Tools",
                  description: "When a support ticket mentions a plumbing issue, resolve it end-to-end instead of referring out.",
                },
              ].map((s) => (
                <div key={s.title} className="p-5 rounded-xl bg-dark-card border border-gray-700">
                  <div className="text-2xl mb-3">{s.icon}</div>
                  <h3 className="font-bold text-white mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-400">{s.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Developer Waitlist */}
          <section id="waitlist" className="scroll-mt-24">
            <div className="max-w-md mx-auto p-6 rounded-xl bg-dark-card border border-gray-700">
              <h2 className="text-xl font-bold text-white text-center mb-2">
                Get API Access
              </h2>
              <p className="text-sm text-gray-400 text-center mb-6">
                Join the developer waitlist. We&apos;ll send you credentials.
              </p>
              {showWaitlist ? (
                <div className="[&_input]:bg-dark [&_input]:border-gray-700 [&_input]:text-gray-300 [&_select]:bg-dark [&_select]:border-gray-700 [&_select]:text-gray-300 [&_p]:text-gray-300">
                  <WaitlistForm type="developer" />
                </div>
              ) : (
                <button
                  onClick={() => setShowWaitlist(true)}
                  className="w-full bg-amber text-navy font-medium py-2.5 rounded-lg hover:bg-amber/90 transition-colors"
                >
                  Request API Key
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
