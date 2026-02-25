# HomeBase AI — Website Build Spec for Claude Code

## Instructions for Claude Code
Read this file completely before writing any code. This is the spec for adding marketing/platform pages to the existing Next.js app at `apps/web/`. The existing product pages (chat, quote, booking, pro job card) stay untouched. You are ADDING new pages alongside them.

---

## Overview
Build a website that tells the HomeBase platform story to three audiences simultaneously: homeowners, home service pros, and developers/agent builders. The site has a **Human ↔ Machine toggle** inspired by parallel.ai — when toggled to Machine, the entire page transforms into structured markdown optimized for AI agent consumption.

## Design Direction

### Aesthetic
- **Not generic SaaS.** Not purple gradients. Not Inter font.
- Warm + technical. Think: the confidence of Stripe's docs meets the warmth of a home services brand.
- Light theme for Human view. Dark theme for Machine view.

### Color Palette
```
--navy:        #0A1628    (primary text, headers)
--navy-light:  #1A2B4A    (secondary text)
--amber:       #E8930C    (primary accent — CTAs, highlights)
--amber-light: #FFF3E0    (amber tint for backgrounds)
--warm-white:  #FAFAF8    (page background)
--cool-gray:   #F3F4F6    (card backgrounds)
--dark:        #111318    (machine view background)
--dark-card:   #1A1D24    (machine view cards)
--green:       #10B981    (success, confidence indicators)
```

### Typography
Use Google Fonts. Load two:
- **Headlines**: `DM Sans` weight 700 — clean, geometric, distinctive but not distracting
- **Body**: `DM Sans` weight 400/500 — same family, reads well at small sizes
- **Code**: `JetBrains Mono` — for all code snippets and Machine view

### Key Interactions
1. **Human ↔ Machine toggle**: Floating pill at bottom-center of viewport (position: fixed). Clicking "Machine" transforms the ENTIRE page into dark-themed structured markdown. Clicking "Human" returns to the visual site. Use CSS transitions for the swap (not a full page reload).
2. **Waitlist card hover-expand**: The "Developers & Platforms" card expands on hover to reveal use case pills (AI Assistants, Property Mgmt SaaS, Insurance/Warranty, Smart Home/IoT, Real Estate). Clicking a pill pre-fills the waitlist form's "use case" field.
3. **Demo section**: Interactive — user clicks a scenario card, watches a simulated scoping conversation play out in real-time (typewriter effect), ending with a quote card.

---

## File Structure (new files only)

```
apps/web/
├── app/
│   ├── page.tsx                         ← REPLACE: currently redirects to /chat. New homepage.
│   ├── layout.tsx                       ← EDIT: add DM Sans + JetBrains Mono fonts
│   ├── demo/
│   │   └── page.tsx                     ← Interactive demo page
│   ├── taxonomy/
│   │   └── page.tsx                     ← Browsable job code table
│   ├── developers/
│   │   └── page.tsx                     ← API docs + developer waitlist
│   ├── pros/
│   │   └── page.tsx                     ← Pro value prop + waitlist
│   └── skill.md/
│       └── route.ts                     ← API route serving raw markdown for agents
├── components/
│   └── marketing/
│       ├── Navbar.tsx                   ← Top nav (logo, links, CTA)
│       ├── Footer.tsx                   ← Footer with links
│       ├── HeroSection.tsx              ← Hero with headline + demo preview
│       ├── HeroDemo.tsx                 ← The interactive demo widget in the hero
│       ├── ViewToggle.tsx               ← The Human/Machine floating toggle pill
│       ├── MachineView.tsx              ← Full-page machine/markdown view
│       ├── HowItWorks.tsx               ← 3-step explanation section
│       ├── TaxonomyPreview.tsx          ← Job code table preview (links to /taxonomy)
│       ├── ApiPreview.tsx               ← Code snippet section with language tabs
│       ├── WaitlistCards.tsx            ← Three waitlist cards with hover-expand
│       ├── WaitlistForm.tsx             ← Shared form modal/inline component
│       ├── FounderSection.tsx           ← PK's story + credentials
│       └── DemoChat.tsx                 ← The simulated chat for demo page
└── lib/
    ├── job-codes.ts                     ← Static job code data (PLM-101 to PLM-901)
    └── demo-scenarios.ts                ← Pre-scripted demo conversations
```

---

## Page 1: Homepage (`app/page.tsx`)

### Section 1 — Navbar
Fixed top. Semi-transparent background with backdrop blur on scroll.
- Left: "HomeBase" wordmark (text, not image. DM Sans 700, navy. The "Base" part in amber.)
- Right links: Demo, Taxonomy, Developers, For Pros
- Right CTA: "Get Early Access" button (amber background, navy text)
- On mobile: hamburger menu

### Section 2 — Hero
```
Home services finally have an API.

AI agents scope, price, and book trusted home service
professionals — starting with plumbing in Boston.

[Try the Demo →]    [Get API Access →]
```

Below the text: the **HeroDemo** widget — a contained box showing a mini scoping conversation. Two tabs at top of the box: "◉ Human" and "○ Machine". 

**Human tab**: Shows a chat-style UI with:
- User message: "My kitchen faucet is leaking from the base"
- AI response: "How long has this been happening? Is the leak constant or only when running?"
- User message: "Just started today, only when the faucet is on"
- Result card: PLM-201 | Faucet Repair | $165 | Tier 1 (92% confidence) | 3 pros available tomorrow

**Machine tab**: Same conversation shown as API request/response:
```
POST /api/v1/scoping/start
{
  "description": "Kitchen faucet leaking from base",
  "address": "123 Main St, Boston, MA 02101"
}

→ 200 OK
{
  "session_id": "sc_8f3k2...",
  "classification": {
    "job_code": "PLM-201",
    "name": "Faucet Repair/Replace",
    "confidence": 0.92,
    "tier": 1,
    "price_cents": 16500
  },
  "available_windows": [
    "2026-03-15T08:00/10:00",
    "2026-03-15T10:00/12:00"
  ]
}
```

The conversation auto-plays with a typewriter effect when the page loads. Replays on click.

### Section 3 — How It Works
Three cards in a row (stack on mobile):

**Card 1: Scope**
Icon: magnifying glass or chat bubble
"Describe the issue. Our AI diagnoses it, classifies it to a standard job code, and asks smart follow-ups. Works via chat, API, or voice."

**Card 2: Price**
Icon: dollar sign with checkmark
"Get a guaranteed price from our validated taxonomy. No surprise bills. No haggling. Same price for humans and agents."

**Card 3: Book**
Icon: calendar with checkmark
"Matched to a licensed, vetted, available pro. Real-time tracking. Scope change mediation. Structured feedback."

### Section 4 — Service Taxonomy Preview
Heading: "The Service Taxonomy"
Subheading: "Every digitized industry has a standard taxonomy. Healthcare has ICD-10. Payments has MCC codes. Home services had nothing. Until now."

Show a clean table with 5-6 rows from the job code library:
| Code | Service | Price | Duration |
|------|---------|-------|----------|
| PLM-101 | Drain Clearing (Single Fixture) | $150 | 45 min |
| PLM-201 | Faucet Repair / Replace | $165 | 60 min |
| PLM-301 | Toilet Repair | $155 | 45 min |
| PLM-401 | Water Heater Diagnostic | $195 | 75 min |
| PLM-501 | Garbage Disposal Install | $225 | 60 min |

Two CTAs below the table:
- "Browse Full Taxonomy →" (links to /taxonomy)
- "GET /api/v1/taxonomy →" (links to /developers, styled as code)

### Section 5 — For Agent Builders (API Preview)
Heading: "Build with the home services API"
Subheading: "Scope, price, and book via code. Three API calls from problem to confirmed booking."

Tabbed code block (Python / TypeScript / cURL):

**Python tab:**
```python
from homebase import HomeBase

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
# → Confirmed. Pro: Mike R. (4.8★, 12yr exp)
```

**TypeScript tab:**
```typescript
import { HomeBase } from '@homebase/sdk';

const hb = new HomeBase({ apiKey: 'hb_sk_...' });

const session = await hb.scoping.start({
  description: 'Kitchen faucet leaking from base',
  address: '123 Main St, Boston, MA 02101',
});

const quote = await hb.quotes.generate({ sessionId: session.id });
// → { code: 'PLM-201', price: 16500, tier: 1 }

const booking = await hb.bookings.create({
  sessionId: session.id,
  customer: { name: 'Alex', phone: '+1...' },
  window: '2026-03-15T10:00/12:00',
});
```

**cURL tab:**
```bash
# 1. Scope
curl -X POST https://api.homebase.ai/v1/scoping/start \
  -H "Authorization: Bearer hb_sk_..." \
  -d '{"description":"Kitchen faucet leaking","address":"123 Main St, Boston"}'

# 2. Quote
curl https://api.homebase.ai/v1/quotes/generate \
  -H "Authorization: Bearer hb_sk_..." \
  -d '{"session_id":"sc_8f3k2..."}'

# 3. Book
curl -X POST https://api.homebase.ai/v1/bookings/create \
  -H "Authorization: Bearer hb_sk_..." \
  -d '{"session_id":"sc_8f3k2...","customer":{"name":"Alex"},"window":"2026-03-15T10:00/12:00"}'
```

CTA below: "Get API Access →" (links to /developers) + "Read the Docs →"

### Section 6 — Waitlist Cards (Three Columns)
Three cards side by side (stack on mobile).

**Card 1: 🏠 Homeowners & Property Managers**
"Get guaranteed-price plumbing in Boston. No surprises. Vetted pros."
CTA: "Join Waitlist"
Form fields: Name, Email, Phone, Zip Code
Type saved as: "homeowner"

**Card 2: 🔧 Pros & Home Service Businesses**
"Confirmed jobs, not shared leads. Fair prices. Same-week payouts."
CTA: "Apply to Join"
Form fields: Name, Company, Phone, License #, Zip Code, # of Techs
Type saved as: "pro"

**Card 3: 🤖 Developers & Platforms**
"Build with the home services API. Scope, price, book via code."
CTA: "Get API Access"
Form fields: Name, Email, Company, Use Case (dropdown)

**HOVER BEHAVIOR on Card 3**: When cursor enters the card, the card smoothly expands (height transition) to reveal 5 use-case pills below the description:
- AI Assistant
- Property Mgmt SaaS
- Insurance / Warranty
- Smart Home / IoT
- Real Estate Platform

Each pill is clickable. Clicking one:
1. Opens the waitlist form (inline or modal)
2. Pre-selects that use case in the dropdown

The expansion is smooth (max-height transition, ~300ms ease). On mobile, the pills are always visible (no hover).

### Section 7 — Founder Section
Minimal. Warm.
```
Built Urban Company from seed to $3B IPO — Asia's largest
home services marketplace. Now building the US version, with
agentic demand.

PK Walia
HBS MBA '27 | Founding team, Urban Company | Ex-Bessemer Venture Partners
```
Link: "pwalia@mba2027.hbs.edu"

### Section 8 — Footer
Simple. Links to all pages. "© 2026 HomeBase AI"

### Floating Toggle — Human ↔ Machine
Position: fixed, bottom: 24px, centered horizontally.
Pill shape with two options: "◉ HUMAN" and "○ MACHINE"
Dark semi-transparent background (backdrop-blur).
Clicking MACHINE triggers the full-page transform to MachineView.

---

## Page 2: Machine View (component, not separate page)

When MACHINE is toggled, the entire page content is replaced with a dark-themed, markdown-formatted version. It's the SAME component tree, just with `viewMode === "machine"` causing a different render.

**Design**: Dark background (#111318). Monospace font (JetBrains Mono). Content rendered as plain text with markdown formatting. All links shown as `[label](url)`. No images. No animations. Copyable code blocks.

**Content structure:**
```
HOMEBASE AI
===========

# Home services finally have an API.
AI agents scope, price, and book trusted professionals.
Starting with plumbing in Boston.

## Navigation
[Demo](https://homebase.ai/demo)
[Taxonomy](https://homebase.ai/taxonomy)
[API Docs](https://homebase.ai/developers)
[For Pros](https://homebase.ai/pros)

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
| PLM-201 | Faucet Repair / Replace         | $165  | 60 min   |
| PLM-301 | Toilet Repair                   | $155  | 45 min   |
| PLM-401 | Water Heater Diagnostic         | $195  | 75 min   |
| PLM-501 | Garbage Disposal Install        | $225  | 60 min   |
| PLM-601 | Pipe Leak Repair (Accessible)   | $245  | 90 min   |
| ...     | [View all 15 codes](/taxonomy)  |       |          |

## MCP Server
{
  "mcpServers": {
    "homebase": {
      "url": "https://mcp.homebase.ai/sse"
    }
  }
}

## Agent Skill
Read https://homebase.ai/skill.md

## API Example (Python)
```python
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
```

## Get API Access
[Request API Key](https://homebase.ai/developers#waitlist)

## Contact
PK Walia | pwalia@mba2027.hbs.edu
HBS MBA '27 | Founding team, Urban Company (seed → $3B IPO)
```

A "Copy All" button at top-right copies the entire markdown to clipboard.
The HUMAN ↔ MACHINE toggle stays visible (same floating pill, now with MACHINE selected).

---

## Page 3: Interactive Demo (`app/demo/page.tsx`)

### Layout
Full navbar + footer. Main content area.

### Top Section
Heading: "Try HomeBase"
Subheading: "Describe a plumbing problem. Watch it get scoped, priced, and matched in real-time."

Human/Machine tabs at top of demo area (same pattern as hero demo).

### Scenario Cards
4 clickable cards in a 2x2 grid:
1. "🔧 Leaking kitchen faucet" — subtitle: "Dripping from the base when turned on"
2. "🚿 Clogged bathroom drain" — subtitle: "Water pooling in the shower"
3. "🔥 No hot water" — subtitle: "Woke up to cold water this morning"
4. "🚽 Toilet keeps running" — subtitle: "Won't stop running after flush"

Also: a text input for free-form description + photo upload button (non-functional, just UI).

### Chat Flow
When a scenario is clicked, a simulated chat plays out:
- Messages appear one at a time with a typewriter effect (~50ms per character)
- 800ms delay between messages
- AI messages have a "typing..." indicator before appearing
- After 2-3 exchanges, a classification result card appears
- Then a quote card with price, what's included, available times
- Final CTA: "Book Now →" which goes to waitlist

### Machine View of Demo
Same conversation shown as sequential API calls with JSON responses. Dark background, monospace.

### Demo Scenarios Data (`lib/demo-scenarios.ts`)

```typescript
export const scenarios = [
  {
    id: "faucet-leak",
    title: "Leaking kitchen faucet",
    subtitle: "Dripping from the base when turned on",
    messages: [
      { role: "user", content: "My kitchen faucet is leaking from the base when I turn it on" },
      { role: "assistant", content: "I can help with that! A couple quick questions to get you an accurate quote:\n\n1. How long has this been happening?\n2. Is it a steady leak or just a few drips?" },
      { role: "user", content: "Started yesterday. It's a steady stream when the water is on, stops when I turn it off." },
      { role: "assistant", content: "Got it — that's typically a worn O-ring or cartridge seal. One more: is this a single-handle or two-handle faucet?" },
      { role: "user", content: "Single handle" },
    ],
    result: {
      job_code: "PLM-201",
      name: "Faucet Repair / Replace",
      confidence: 0.92,
      tier: 1,
      price_cents: 16500,
      duration_min: 60,
      includes: ["Labor", "Standard cartridge/O-ring", "Testing and cleanup"],
      available_windows: ["Tomorrow 8am-10am", "Tomorrow 10am-12pm", "Tomorrow 2pm-4pm"],
    },
    api_request: {
      method: "POST",
      path: "/api/v1/scoping/start",
      body: { description: "Kitchen faucet leaking from base when turned on", address: "123 Main St, Boston, MA 02101" },
    },
    api_response: {
      session_id: "sc_8f3k2m9x",
      classification: { job_code: "PLM-201", name: "Faucet Repair/Replace", confidence: 0.92, tier: 1, price_cents: 16500 },
      available_windows: ["2026-03-15T08:00/10:00", "2026-03-15T10:00/12:00", "2026-03-15T14:00/16:00"],
    },
  },
  {
    id: "clogged-drain",
    title: "Clogged bathroom drain",
    subtitle: "Water pooling in the shower",
    messages: [
      { role: "user", content: "The drain in my shower is clogged. Water pools up to my ankles." },
      { role: "assistant", content: "That's no fun! Let me ask a few things to scope this properly:\n\n1. Is this a bathtub/shower combo or a standalone shower?\n2. Have you tried any drain cleaner or a plunger?" },
      { role: "user", content: "Standalone shower stall. I tried liquid drain cleaner but it didn't help." },
      { role: "assistant", content: "Understood — if chemical cleaners didn't work, it's likely a deeper blockage. Is this the only drain in the house that's slow, or are others affected too?" },
      { role: "user", content: "Just this one drain" },
    ],
    result: {
      job_code: "PLM-101",
      name: "Drain Clearing (Single Fixture)",
      confidence: 0.88,
      tier: 1,
      price_cents: 15000,
      duration_min: 45,
      includes: ["Labor", "Snake/auger clearing", "Camera inspection if needed"],
      available_windows: ["Tomorrow 8am-10am", "Tomorrow 12pm-2pm", "Day after 8am-10am"],
    },
    api_request: {
      method: "POST",
      path: "/api/v1/scoping/start",
      body: { description: "Shower drain clogged, water pooling", address: "45 Beacon St, Boston, MA 02108" },
    },
    api_response: {
      session_id: "sc_j7nq4p2r",
      classification: { job_code: "PLM-101", name: "Drain Clearing (Single Fixture)", confidence: 0.88, tier: 1, price_cents: 15000 },
      available_windows: ["2026-03-15T08:00/10:00", "2026-03-15T12:00/14:00", "2026-03-16T08:00/10:00"],
    },
  },
  {
    id: "no-hot-water",
    title: "No hot water",
    subtitle: "Woke up to cold water this morning",
    messages: [
      { role: "user", content: "I have no hot water. It was fine last night but this morning everything is cold." },
      { role: "assistant", content: "That's a rough way to start the day! Let me help figure out what's going on:\n\n1. Do you have a tank water heater or tankless?\n2. Is the pilot light visible (if gas), or do you see any error codes?" },
      { role: "user", content: "Tank water heater, gas. I checked and the pilot light is out." },
      { role: "assistant", content: "Pilot light out overnight is a common issue — could be the thermocouple. Have you tried relighting it?" },
      { role: "user", content: "I tried but it won't stay lit" },
    ],
    result: {
      job_code: "PLM-401",
      name: "Water Heater Diagnostic + Repair",
      confidence: 0.85,
      tier: 1,
      price_cents: 19500,
      duration_min: 75,
      includes: ["Diagnostic", "Thermocouple replacement if needed", "Pilot relight and safety check"],
      available_windows: ["Today 2pm-4pm (ASAP)", "Tomorrow 8am-10am", "Tomorrow 10am-12pm"],
    },
    api_request: {
      method: "POST",
      path: "/api/v1/scoping/start",
      body: { description: "No hot water, pilot light won't stay lit", address: "78 Commonwealth Ave, Boston, MA 02116" },
    },
    api_response: {
      session_id: "sc_m2kx8w5t",
      classification: { job_code: "PLM-401", name: "Water Heater Diagnostic + Repair", confidence: 0.85, tier: 1, price_cents: 19500 },
      available_windows: ["2026-03-14T14:00/16:00", "2026-03-15T08:00/10:00", "2026-03-15T10:00/12:00"],
    },
  },
  {
    id: "running-toilet",
    title: "Toilet keeps running",
    subtitle: "Won't stop running after flush",
    messages: [
      { role: "user", content: "My toilet keeps running after I flush. I have to jiggle the handle to make it stop." },
      { role: "assistant", content: "Classic toilet issue! A few questions:\n\n1. Does jiggling the handle always fix it, or does it sometimes keep running?\n2. Do you hear the water running continuously, or does it cycle on and off?" },
      { role: "user", content: "Jiggling usually works but sometimes I have to hold it. It runs continuously." },
      { role: "assistant", content: "Sounds like the flapper valve isn't seating properly. How old is the toilet, roughly?" },
      { role: "user", content: "Maybe 15 years? It's the original one from when we moved in." },
    ],
    result: {
      job_code: "PLM-301",
      name: "Toilet Repair",
      confidence: 0.91,
      tier: 1,
      price_cents: 15500,
      duration_min: 45,
      includes: ["Labor", "Flapper valve replacement", "Fill valve adjustment", "Flush test"],
      available_windows: ["Tomorrow 10am-12pm", "Tomorrow 2pm-4pm", "Day after 8am-10am"],
    },
    api_request: {
      method: "POST",
      path: "/api/v1/scoping/start",
      body: { description: "Toilet keeps running after flush", address: "200 Newbury St, Boston, MA 02116" },
    },
    api_response: {
      session_id: "sc_p9nt3v7a",
      classification: { job_code: "PLM-301", name: "Toilet Repair", confidence: 0.91, tier: 1, price_cents: 15500 },
      available_windows: ["2026-03-15T10:00/12:00", "2026-03-15T14:00/16:00", "2026-03-16T08:00/10:00"],
    },
  },
];
```

---

## Page 4: Taxonomy (`app/taxonomy/page.tsx`)

Full browsable table of all 15 PLM job codes.

### Layout
Navbar + searchable/filterable table.

Heading: "The HomeBase Service Taxonomy"
Subheading: "Every job is a defined SKU — standardized scope, transparent pricing, clear deliverables."

Human/Machine toggle on this page too:
- **Human view**: Visual table with expandable rows
- **Machine view**: JSON response from `GET /taxonomy/job-codes`

### Table Columns
| Code | Service | Base Price | Duration | Category | Tier 1 Rate |

Each row is expandable. Clicking a row reveals:
- Full description
- What's included
- What's not included
- Scoping criteria (what questions the AI asks)
- Applicable adjustments (after-hours +$40, weekend +$40, etc.)

### Job Codes Data (`lib/job-codes.ts`)
Store all 15 PLM codes as a static TypeScript array. Use the data from your seed file. Structure:

```typescript
export interface JobCode {
  code: string;
  name: string;
  description: string;
  base_price_cents: number;
  estimated_duration_min: number;
  parts_included: boolean;
  category: string;
  includes: string[];
  excludes: string[];
  scoping_signals: string[];
}

export const JOB_CODES: JobCode[] = [
  {
    code: "PLM-101",
    name: "Drain Clearing (Single Fixture)",
    description: "Clear a clogged drain in a single fixture — sink, shower, or tub.",
    base_price_cents: 15000,
    estimated_duration_min: 45,
    parts_included: false,
    category: "Drains",
    includes: ["Labor", "Basic snake/auger", "Camera inspection if needed"],
    excludes: ["Main line clearing", "Pipe repair if damaged"],
    scoping_signals: ["Single fixture affected", "Slow drain or full blockage", "No sewage backup"],
  },
  // ... add all 15 codes from your seed data
];
```

---

## Page 5: Developers (`app/developers/page.tsx`)

### Layout
Dark-themed page (even in Human mode — this is a developer docs page).

### Sections

**1. Hero**
"Build with the HomeBase API"
"Scope, price, and book home services programmatically. Three API calls from problem to confirmed booking."
[Join Waitlist for API Access]

**2. Quick Start**
Step 1: Get an API key (waitlist → we'll email you)
Step 2: Scope a job (POST /scoping/start)
Step 3: Get a quote (POST /quotes/generate)
Step 4: Book (POST /bookings/create)

**3. Endpoints Reference**
Table of all endpoints with method, path, description:
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /scoping/start | Start a scoping session |
| POST | /scoping/{id}/message | Continue conversation |
| POST | /quotes/generate | Generate quote from session |
| POST | /bookings/create | Book a pro |
| GET | /taxonomy/job-codes | List all job codes |
| GET | /taxonomy/job-codes/{code} | Get single job code details |

**4. Integration Options**
Three cards:
- REST API — Python & TypeScript SDKs (coming soon)
- MCP Server — config snippet for Claude Desktop / Cursor
- Agent Skill — link to /skill.md

**5. MCP Server Config**
```json
{
  "mcpServers": {
    "homebase": {
      "url": "https://mcp.homebase.ai/sse"
    }
  }
}
```
(Note: display as "Coming Soon" — not functional yet)

**6. Developer Waitlist Form** (anchor: #waitlist)
Fields: Name, Email, Company, Use Case (dropdown: AI Assistant, Property Mgmt SaaS, Insurance/Warranty, Smart Home/IoT, Real Estate Platform, Other)
Submit → Supabase `waitlist_signups` table

---

## Page 6: For Pros (`app/pros/page.tsx`)

### Sections

**1. Hero**
"Confirmed jobs. Fair prices. Get paid fast."
"HomeBase sends you pre-scoped, pre-priced plumbing jobs. Accept with one tap. No lead fees. No bidding wars."

**2. How It's Different (3 cards)**
- "Not a lead — a confirmed job": "Every job comes with a guaranteed price, full scoping notes, and customer photos. If you accept, the job is yours."
- "No awkward price talks": "Prices come from our validated taxonomy. Scope changes go through the system — customer approves before you proceed."
- "Same-week payouts": "Get paid via direct deposit within days of job completion. $22 booking fee, that's it."

**3. What You See (Job Card Preview)**
A styled mockup of the pro job card showing: service name, address, price, schedule, customer info (masked), scoping notes, Accept/Decline buttons.

**4. Pro Waitlist Form**
Fields: Name, Company Name, Phone, License #, Zip Code, Number of Techs, How did you hear about us?
Submit → Supabase `waitlist_signups` table with type "pro"

---

## Page 7: skill.md Route (`app/skill.md/route.ts`)

An API route that serves raw markdown. This is what AI agents read to understand how to use HomeBase.

```typescript
export async function GET() {
  const markdown = `# HomeBase AI — Agent Integration Guide

## What Is HomeBase?
HomeBase is the transaction API for home services. Use it to scope, price,
and book professional home service work for your users.

## Currently Supported
- Trade: Residential plumbing
- Area: Greater Boston, MA (02101-02299)
- Job codes: 15 (PLM-101 through PLM-901)
- Hours: 7 AM – 7 PM ET, Mon–Sat

## API Base URL
https://api.homebase.ai/v1

## Authentication
Header: Authorization: Bearer hb_sk_{your_key}
Get a key: https://homebase.ai/developers

## Core Workflow

### 1. Scope a job
POST /scoping/start
{ "description": "string", "photos": ["url"], "address": "string" }
Returns: session_id, classification, follow_up_questions

### 2. Continue conversation (if needed)
POST /scoping/{session_id}/message
{ "message": "string", "photos": ["url"] }
Returns: updated classification or more questions

### 3. Get quote
POST /quotes/generate
{ "session_id": "string" }
Returns: job_code, price, available time windows

### 4. Book
POST /bookings/create
{ "session_id": "string", "customer": {...}, "window": "ISO 8601" }
Returns: booking confirmation, pro details, tracking URL

### 5. Browse taxonomy
GET /taxonomy/job-codes
GET /taxonomy/job-codes/{code}

## MCP Server (coming soon)
{ "mcpServers": { "homebase": { "url": "https://mcp.homebase.ai/sse" } } }
`;

  return new Response(markdown, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
```

---

## Waitlist Backend

All waitlist forms submit to a single Supabase table:

```sql
CREATE TABLE waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,           -- 'homeowner' | 'pro' | 'developer'
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  zip_code TEXT,
  license_number TEXT,
  num_techs INTEGER,
  use_case TEXT,               -- for developers: 'ai_assistant' | 'property_mgmt' | etc.
  referral_source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Route for Waitlist (`app/api/waitlist/route.ts`)
```typescript
// POST /api/waitlist
// Body: { type, name, email, phone?, company?, zip_code?, ... }
// Inserts into Supabase waitlist_signups table
// Returns: { success: true }
```

Use the Supabase client library (already in the project from Sprint 0). If Supabase isn't configured in the frontend env, store locally and show success anyway (graceful degradation for demo purposes).

---

## Important Implementation Notes

1. **Don't break existing pages.** The chat, quote, booking, and pro job card pages must continue working. The homepage (`app/page.tsx`) currently redirects to `/chat` — replace it with the new homepage, but make sure `/chat` still works as a direct URL.

2. **The demo is MOCKED, not real.** Use the pre-scripted scenarios in `lib/demo-scenarios.ts`. Add a comment showing where to swap in real API calls later.

3. **Mobile-first.** All pages must work on iPhone Safari. Test at 375px width.

4. **No new dependencies unless essential.** Use Tailwind for everything. No Framer Motion (use CSS transitions). No UI library.

5. **The Human/Machine toggle is a CSS transition, not a page reload.** Use React state. The toggle is a single component rendered in a fixed position.

6. **Keep components under 150 lines.** Break up as needed.

7. **Use `"use client"` only when state/interactivity is needed.** Server components by default.

---

## Build Order for Claude Code

1. `lib/job-codes.ts` + `lib/demo-scenarios.ts` (data files — no UI)
2. `components/marketing/Navbar.tsx` + `Footer.tsx` + `ViewToggle.tsx`
3. `app/page.tsx` (homepage — all sections)
4. `components/marketing/MachineView.tsx`
5. `app/demo/page.tsx` + `components/marketing/DemoChat.tsx`
6. `app/taxonomy/page.tsx`
7. `app/developers/page.tsx`
8. `app/pros/page.tsx`
9. `app/skill.md/route.ts`
10. `app/api/waitlist/route.ts`
11. Polish: responsive, transitions, dark mode toggle animation
