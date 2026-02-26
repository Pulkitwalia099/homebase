/**
 * Typed API client — all calls go through Next.js API routes.
 * No external backend needed — everything runs on Vercel.
 */
import type { ApiResponse, ScopingResponse, QuoteData } from "./types";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const res = await fetch(path, {
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

  if ("data" in json) return json as ApiResponse<T>;
  return { data: json as T, error: null };
}

// ── Scoping ───────────────────────────────────

export async function startScopingSession(
  initialMessage: string
): Promise<ApiResponse<ScopingResponse>> {
  return request<ScopingResponse>("/api/scoping/start", {
    method: "POST",
    body: JSON.stringify({ initial_message: initialMessage }),
  });
}

export async function sendScopingMessage(
  sessionId: string,
  message: string
): Promise<ApiResponse<ScopingResponse>> {
  return request<ScopingResponse>(`/api/scoping/${sessionId}/message`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

// ── Quotes ────────────────────────────────────

export async function getQuote(sessionId: string): Promise<ApiResponse<QuoteData>> {
  return request<QuoteData>(`/api/scoping/${sessionId}/quote`);
}
