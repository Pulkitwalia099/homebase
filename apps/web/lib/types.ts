// ──────────────────────────────────────────────
// Shared TypeScript types — mirror the DB models
// ──────────────────────────────────────────────

export type ConfidenceTier = "tier1" | "tier2" | "tier3";
export type JobStatus =
  | "pending_pro_accept"
  | "confirmed"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

// Chat / Scoping

// Compact quote returned inline by the scoping endpoint on classification.
// Different shape from QuoteData (which is the full quote page data).
export interface ScopingQuoteData {
  job_code: string;               // e.g. "PLM-001"
  job_name: string;               // e.g. "Faucet Leak Repair"
  final_price_cents: number;
  confidence_tier: ConfidenceTier;
  estimated_duration_min: number;
  price_breakdown?: Array<{ label: string; amount_cents: number }>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  quoteData?: ScopingQuoteData;   // set only on the classification message — triggers QuoteBubble
}

export interface ScopingResponse {
  session_id: string;
  message: string;
  is_classified: boolean;
  quote?: ScopingQuoteData;
}

// Quote
export interface QuoteData {
  session_id: string;
  job_code: {
    code: string;
    name: string;
    description: string;
    estimated_duration_min: number;
    parts_included: boolean;
    category: string;
  };
  quoted_price_cents: number;
  price_breakdown: Array<{
    label: string;
    amount_cents: number;
  }>;
  whats_included: string[];
  confidence_tier: ConfidenceTier;
  diagnosis_summary?: string;
  adjustment_flags: {
    old_home: boolean;
    accessibility: boolean;
    after_hours: boolean;
    weekend: boolean;
    same_day: boolean;
    evening: boolean;
  };
}

// Booking
export interface BookingRequest {
  session_id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    property_year_built?: number;
    accessibility_issues?: boolean;
  };
  scheduled_window: "morning" | "afternoon" | "emergency";
  scheduled_date: string; // ISO date string
}

export interface BookingResponse {
  job_id: string;
  customer_id: string;
  client_secret: string; // Stripe SetupIntent client_secret
  stripe_customer_id: string;
  quoted_price_cents: number;
}

// Job (pro-facing)
export interface ProJobCard {
  job_id: string;
  service_name: string;
  service_description: string;
  customer_display_name: string; // "Sarah M."
  customer_phone_masked: string; // "(512) 555-••••"
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  quoted_price_cents: number;
  scheduled_date: string;
  scheduled_window: string; // "8am – 12pm"
  photos: string[];
  scoping_notes: string;
  status: JobStatus;
}

// API response envelope
export interface ApiResponse<T> {
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
}
