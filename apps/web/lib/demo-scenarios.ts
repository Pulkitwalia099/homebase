export interface DemoMessage {
  role: "user" | "assistant";
  content: string;
}

export interface DemoResult {
  job_code: string;
  name: string;
  confidence: number;
  tier: number;
  price_cents: number;
  duration_min: number;
  includes: string[];
  available_windows: string[];
}

export interface DemoApiRequest {
  method: string;
  path: string;
  body: Record<string, string>;
}

export interface DemoApiResponse {
  session_id: string;
  classification: {
    job_code: string;
    name: string;
    confidence: number;
    tier: number;
    price_cents: number;
  };
  available_windows: string[];
}

export interface DemoScenario {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  messages: DemoMessage[];
  result: DemoResult;
  api_request: DemoApiRequest;
  api_response: DemoApiResponse;
}

export const scenarios: DemoScenario[] = [
  {
    id: "faucet-leak",
    title: "Leaking kitchen faucet",
    subtitle: "Dripping from the base when turned on",
    emoji: "🔧",
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
      available_windows: ["Tomorrow 8am–10am", "Tomorrow 10am–12pm", "Tomorrow 2pm–4pm"],
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
    emoji: "🚿",
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
      available_windows: ["Tomorrow 8am–10am", "Tomorrow 12pm–2pm", "Day after 8am–10am"],
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
    emoji: "🔥",
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
      available_windows: ["Today 2pm–4pm (ASAP)", "Tomorrow 8am–10am", "Tomorrow 10am–12pm"],
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
    emoji: "🚽",
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
      available_windows: ["Tomorrow 10am–12pm", "Tomorrow 2pm–4pm", "Day after 8am–10am"],
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
