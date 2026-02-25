"use client";

import { useState } from "react";

const MARKDOWN = `HOMEBASE AI
===========

# Home services finally have an API.
AI agents scope, price, and book trusted professionals.
Starting with plumbing in Boston.

## Navigation
[Demo](/demo)
[Taxonomy](/taxonomy)
[API Docs](/developers)
[For Pros](/pros)

## Quick Start
Base URL: https://api.homebase.ai/v1
Auth: Bearer hb_sk_...

POST /scoping/start        → Scope a job
POST /quotes/generate       → Get guaranteed pricing
POST /bookings/create       → Book a pro
GET  /taxonomy/job-codes    → Browse service taxonomy

## Service Coverage
Area: Greater Boston, MA (02101-02299)
Trades: Plumbing (15 job codes: PLM-101 → PLM-901)
Hours: 7 AM – 7 PM ET, Mon–Sat
Coming: HVAC (Q3 2026), Electrical (Q4 2026)

## Service Taxonomy
| Code    | Service                         | Price | Duration |
|---------|---------------------------------|-------|----------|
| PLM-101 | Drain Clearing (Single Fixture) | $150  | 45 min   |
| PLM-102 | Drain Clearing (Multiple)       | $225  | 75 min   |
| PLM-103 | Main Line Clearing              | $350  | 120 min  |
| PLM-201 | Faucet Repair / Replace         | $165  | 60 min   |
| PLM-202 | Shut-off Valve Repair           | $185  | 60 min   |
| PLM-301 | Toilet Repair                   | $155  | 45 min   |
| PLM-302 | Toilet Replace / Install        | $325  | 90 min   |
| PLM-401 | Water Heater Diagnostic         | $195  | 75 min   |
| PLM-402 | Water Heater Flush              | $175  | 60 min   |
| PLM-501 | Garbage Disposal Install        | $225  | 60 min   |
| PLM-601 | Pipe Leak Repair (Accessible)   | $245  | 90 min   |
| PLM-602 | Pipe Leak Repair (Behind Wall)  | $450  | 180 min  |
| PLM-701 | Sump Pump Repair / Replace      | $350  | 120 min  |
| PLM-801 | Outdoor Hose Bib Repair         | $195  | 60 min   |
| PLM-901 | General Plumbing Diagnostic     | $145  | 60 min   |

## MCP Server
{
  "mcpServers": {
    "homebase": {
      "url": "https://mcp.homebase.ai/sse"
    }
  }
}

## Agent Skill
Read /skill.md

## API Example (Python)
\`\`\`python
from homebase import HomeBase
client = HomeBase(api_key="hb_sk_...")
session = client.scoping.start(
    description="Kitchen faucet leaking from base",
    address="123 Main St, Boston, MA 02101"
)
quote = client.quotes.generate(session_id=session.id)
booking = client.bookings.create(
    session_id=session.id,
    customer={"name": "Alex", "phone": "+1..."},
    window="2026-03-15T10:00/12:00"
)
\`\`\`

## Get API Access
[Request API Key](/developers#waitlist)

## Contact
PK Walia | pwalia@mba2027.hbs.edu
HBS MBA '27 | Founding team, Urban Company (seed → $3B IPO)`;

export default function MachineView() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(MARKDOWN);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-dark pt-8 pb-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto relative">
        <button
          onClick={handleCopy}
          className="absolute top-0 right-0 text-xs font-mono text-gray-500 hover:text-green px-3 py-1.5 border border-gray-700 rounded-lg transition-colors"
        >
          {copied ? "Copied!" : "Copy All"}
        </button>
        <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed pt-10">
          {MARKDOWN}
        </pre>
      </div>
    </div>
  );
}
