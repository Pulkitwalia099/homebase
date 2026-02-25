"use client";

import { useState } from "react";
import Link from "next/link";

const TABS = ["Python", "TypeScript", "cURL"] as const;

const CODE: Record<(typeof TABS)[number], string> = {
  Python: `from homebase import HomeBase

client = HomeBase(api_key="hb_sk_...")

# Scope a plumbing issue
session = client.scoping.start(
    description="Kitchen faucet leaking from base",
    photos=["https://..."],
    address="123 Main St, Boston, MA 02101"
)

# Get the quote
quote = client.quotes.generate(session_id=session.id)
# → PLM-201 | Faucet Repair | $165 | Tier 1

# Book it
booking = client.bookings.create(
    session_id=session.id,
    customer={"name": "Alex", "phone": "+1..."},
    window="2026-03-15T10:00/12:00"
)
# → Confirmed. Pro: Mike R. (4.8★, 12yr exp)`,

  TypeScript: `import { HomeBase } from '@homebase/sdk';

const hb = new HomeBase({ apiKey: 'hb_sk_...' });

const session = await hb.scoping.start({
  description: 'Kitchen faucet leaking from base',
  address: '123 Main St, Boston, MA 02101',
});

const quote = await hb.quotes.generate({
  sessionId: session.id,
});
// → { code: 'PLM-201', price: 16500, tier: 1 }

const booking = await hb.bookings.create({
  sessionId: session.id,
  customer: { name: 'Alex', phone: '+1...' },
  window: '2026-03-15T10:00/12:00',
});`,

  cURL: `# 1. Scope
curl -X POST https://api.homebase.ai/v1/scoping/start \\
  -H "Authorization: Bearer hb_sk_..." \\
  -d '{"description":"Kitchen faucet leaking","address":"123 Main St, Boston"}'

# 2. Quote
curl https://api.homebase.ai/v1/quotes/generate \\
  -H "Authorization: Bearer hb_sk_..." \\
  -d '{"session_id":"sc_8f3k2..."}'

# 3. Book
curl -X POST https://api.homebase.ai/v1/bookings/create \\
  -H "Authorization: Bearer hb_sk_..." \\
  -d '{"session_id":"sc_8f3k2...","customer":{"name":"Alex"},"window":"2026-03-15T10:00/12:00"}'`,
};

export default function ApiPreview() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Python");

  return (
    <section className="py-24 px-4 sm:px-6 bg-[#111318]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center">
          <p className="text-xs font-medium tracking-widest uppercase text-amber mb-3">
            For Developers
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Build with the home services API
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-xl mx-auto">
            Three API calls from problem to confirmed booking.
          </p>
        </div>

        {/* Code block — terminal style */}
        <div className="mt-12 max-w-2xl mx-auto rounded-2xl overflow-hidden border border-white/5 bg-[#0D1117] shadow-2xl">
          {/* Title bar with macOS dots */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#161B22] border-b border-white/5">
            <div className="flex gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
            <span className="text-xs font-mono text-gray-500">homebase-quickstart</span>
            <div className="w-12" />
          </div>

          {/* Language tabs */}
          <div className="flex border-b border-white/5 bg-[#161B22]">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-sm font-mono transition-colors ${
                  activeTab === tab
                    ? "text-amber border-b-2 border-amber"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Code content */}
          <pre className="p-5 overflow-x-auto">
            <code className="text-sm font-mono text-gray-300 leading-relaxed whitespace-pre">
              {CODE[activeTab]}
            </code>
          </pre>
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            href="/developers"
            className="text-sm font-medium text-amber hover:text-amber/80 transition-colors"
          >
            Get API Access →
          </Link>
          <Link
            href="/developers"
            className="text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors"
          >
            Read the Docs →
          </Link>
        </div>
      </div>
    </section>
  );
}
