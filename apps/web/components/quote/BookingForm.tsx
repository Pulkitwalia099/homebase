"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { BookingRequest, QuoteData } from "@/lib/types";

interface BookingFormProps {
  quote: QuoteData;
  onSubmit: (data: BookingRequest) => Promise<void>;
  isSubmitting?: boolean;
}

type Step = 1 | 2 | 3;

const TIME_SLOTS = [
  { id: "morning", label: "Morning", time: "8am – 12pm", surcharge: null },
  { id: "afternoon", label: "Afternoon", time: "12pm – 5pm", surcharge: null },
  { id: "emergency", label: "Emergency", time: "ASAP", surcharge: "+$75" },
] as const;

// Next 5 available weekdays
function getAvailableDates(): Array<{ value: string; label: string }> {
  const dates = [];
  const now = new Date();
  let d = new Date(now);
  d.setDate(d.getDate() + 1); // Start tomorrow

  while (dates.length < 5) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) { // Skip weekends for now
      dates.push({
        value: d.toISOString().split("T")[0],
        label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export function BookingForm({ quote, onSubmit, isSubmitting = false }: BookingFormProps) {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    year_built: "",
    accessibility_issues: false,
    scheduled_date: "",
    scheduled_window: "morning" as "morning" | "afternoon" | "emergency",
  });

  const dates = getAvailableDates();

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    await onSubmit({
      session_id: quote.session_id,
      customer: { name: form.name, email: form.email, phone: form.phone },
      address: {
        street: form.street,
        city: form.city,
        state: form.state,
        zip: form.zip,
        property_year_built: form.year_built ? parseInt(form.year_built) : undefined,
        accessibility_issues: form.accessibility_issues,
      },
      scheduled_window: form.scheduled_window,
      scheduled_date: form.scheduled_date,
    });
  };

  return (
    <div>
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s
                  ? "bg-blue-600 text-white"
                  : step > s
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step > s ? "✓" : s}
            </div>
            {s < 3 && <div className={`flex-1 h-0.5 w-8 ${step > s ? "bg-green-500" : "bg-gray-200"}`} />}
          </div>
        ))}
        <span className="text-xs text-gray-500 ml-2">
          {step === 1 ? "Address" : step === 2 ? "Schedule" : "Your info"}
        </span>
      </div>

      {/* Step 1 — Address */}
      {step === 1 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-gray-900">Service address</h3>
          <input
            type="text"
            placeholder="Street address"
            value={form.street}
            onChange={(e) => update("street", e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="City"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className="col-span-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
            <input
              type="text"
              placeholder="State"
              maxLength={2}
              value={form.state}
              onChange={(e) => update("state", e.target.value.toUpperCase())}
              className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
            <input
              type="text"
              placeholder="ZIP"
              maxLength={5}
              value={form.zip}
              onChange={(e) => update("zip", e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <input
            type="number"
            placeholder="Year home was built (optional)"
            value={form.year_built}
            onChange={(e) => update("year_built", e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.accessibility_issues}
              onChange={(e) => update("accessibility_issues", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            Difficult access (crawlspace, tight quarters, no local shutoff)
          </label>
          <Button
            variant="primary"
            size="lg"
            className="w-full mt-4"
            disabled={!form.street || !form.city || !form.state || !form.zip}
            onClick={() => setStep(2)}
          >
            Continue
          </Button>
        </div>
      )}

      {/* Step 2 — Schedule */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">When works for you?</h3>

          {/* Date picker */}
          <div className="grid grid-cols-5 gap-2">
            {dates.map((d) => (
              <button
                key={d.value}
                onClick={() => update("scheduled_date", d.value)}
                className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                  form.scheduled_date === d.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                {d.label.split(",")[0]}
                <br />
                <span className="text-gray-500 font-normal">{d.label.split(",")[1]}</span>
              </button>
            ))}
          </div>

          {/* Time window */}
          <div className="space-y-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot.id}
                onClick={() => update("scheduled_window", slot.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
                  form.scheduled_window === slot.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="font-medium">{slot.label}</span>
                <span className={slot.surcharge ? "text-orange-600 font-medium" : "text-gray-500"}>
                  {slot.surcharge || slot.time}
                </span>
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-400">
            We'll confirm your appointment within 30 minutes of booking.
          </p>

          <div className="flex gap-2">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={!form.scheduled_date}
              onClick={() => setStep(3)}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — Customer info */}
      {step === 3 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-gray-900">Your contact info</h3>
          <input
            type="text"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
          <p className="text-xs text-gray-400">
            We'll text job updates to your phone. No spam.
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={!form.name || !form.email || !form.phone || isSubmitting}
              loading={isSubmitting}
              onClick={handleSubmit}
            >
              Continue to Payment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
