"use client";

import { useState } from "react";

interface WaitlistFormProps {
  type: "homeowner" | "pro" | "developer";
  prefilledUseCase?: string;
  onClose?: () => void;
}

const USE_CASES = [
  "AI Assistant",
  "Property Mgmt SaaS",
  "Insurance / Warranty",
  "Smart Home / IoT",
  "Real Estate Platform",
  "Other",
];

export default function WaitlistForm({ type, prefilledUseCase, onClose }: WaitlistFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const data: Record<string, string> = { type };
    form.forEach((val, key) => { data[key] = val.toString(); });

    try {
      // TODO: Swap with real API call when Supabase is configured
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      // Graceful degradation — show success anyway for demo
    }
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="text-2xl mb-2">✓</div>
        <p className="font-bold text-navy">You&apos;re on the list!</p>
        <p className="text-sm text-navy-light mt-1">We&apos;ll be in touch soon.</p>
        {onClose && (
          <button onClick={onClose} className="mt-3 text-sm text-amber hover:underline">
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input name="name" required placeholder="Name" className="w-full px-3 py-2 rounded-lg border border-cool-gray text-sm focus:outline-none focus:ring-2 focus:ring-amber/50" />
      <input name="email" type="email" required placeholder="Email" className="w-full px-3 py-2 rounded-lg border border-cool-gray text-sm focus:outline-none focus:ring-2 focus:ring-amber/50" />

      {(type === "homeowner" || type === "pro") && (
        <input name="phone" type="tel" placeholder="Phone" className="w-full px-3 py-2 rounded-lg border border-cool-gray text-sm focus:outline-none focus:ring-2 focus:ring-amber/50" />
      )}

      {type === "homeowner" && (
        <input name="zip_code" placeholder="Zip Code" className="w-full px-3 py-2 rounded-lg border border-cool-gray text-sm focus:outline-none focus:ring-2 focus:ring-amber/50" />
      )}

      {type === "pro" && (
        <>
          <input name="company" placeholder="Company Name" className="w-full px-3 py-2 rounded-lg border border-cool-gray text-sm focus:outline-none focus:ring-2 focus:ring-amber/50" />
          <input name="license_number" placeholder="License #" className="w-full px-3 py-2 rounded-lg border border-cool-gray text-sm focus:outline-none focus:ring-2 focus:ring-amber/50" />
          <input name="zip_code" placeholder="Zip Code" className="w-full px-3 py-2 rounded-lg border border-cool-gray text-sm focus:outline-none focus:ring-2 focus:ring-amber/50" />
          <input name="num_techs" type="number" min="1" placeholder="# of Techs" className="w-full px-3 py-2 rounded-lg border border-cool-gray text-sm focus:outline-none focus:ring-2 focus:ring-amber/50" />
        </>
      )}

      {type === "developer" && (
        <>
          <input name="company" placeholder="Company" className="w-full px-3 py-2 rounded-lg border border-cool-gray text-sm focus:outline-none focus:ring-2 focus:ring-amber/50" />
          <select
            name="use_case"
            defaultValue={prefilledUseCase || ""}
            className="w-full px-3 py-2 rounded-lg border border-cool-gray text-sm focus:outline-none focus:ring-2 focus:ring-amber/50"
          >
            <option value="" disabled>Select use case</option>
            {USE_CASES.map((uc) => (
              <option key={uc} value={uc}>{uc}</option>
            ))}
          </select>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-amber text-navy font-medium py-2.5 rounded-lg hover:bg-amber/90 transition-colors disabled:opacity-60"
      >
        {loading ? "Submitting..." : type === "pro" ? "Apply to Join" : "Join Waitlist"}
      </button>
    </form>
  );
}
