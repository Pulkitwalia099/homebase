/**
 * Typed API client — all calls go through the Next.js proxy (/api/chat)
 * or directly to FastAPI (server-side calls from Server Components).
 */
import type { ApiResponse, ScopingResponse, QuoteData, BookingRequest, BookingResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    return {
      data: null,
      error: json.error || { code: "UNKNOWN_ERROR", message: "An unexpected error occurred" },
    };
  }

  // FastAPI returns { data, error } envelope
  if ("data" in json) return json as ApiResponse<T>;

  // If FastAPI returns unwrapped, wrap it
  return { data: json as T, error: null };
}

// ── Scoping ───────────────────────────────────

export async function startScopingSession(
  initialMessage: string
): Promise<ApiResponse<ScopingResponse>> {
  return request<ScopingResponse>("/scoping/start", {
    method: "POST",
    body: JSON.stringify({ initial_message: initialMessage, channel: "web" }),
  });
}

export async function sendScopingMessage(
  sessionId: string,
  message: string
): Promise<ApiResponse<ScopingResponse>> {
  return request<ScopingResponse>("/scoping/message", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, message }),
  });
}

// ── Quotes ────────────────────────────────────

export async function getQuote(sessionId: string): Promise<ApiResponse<QuoteData>> {
  return request<QuoteData>(`/quotes/${sessionId}`);
}

// ── Bookings ──────────────────────────────────

export async function createBooking(
  booking: BookingRequest
): Promise<ApiResponse<BookingResponse>> {
  return request<BookingResponse>("/bookings", {
    method: "POST",
    body: JSON.stringify(booking),
  });
}

// ── Pros ──────────────────────────────────────

export async function acceptJob(
  jobId: string,
  token: string
): Promise<ApiResponse<{ confirmed: boolean }>> {
  return request<{ confirmed: boolean }>(`/pros/jobs/${jobId}/accept`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}
