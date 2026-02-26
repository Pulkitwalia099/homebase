"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { DemoNavbar } from "@/components/demo/DemoNavbar";
import { getQuote } from "@/lib/api-client";
import type { QuoteData } from "@/lib/types";

const TIME_SLOTS = [
  { id: "tomorrow-morning", label: "Tomorrow", time: "8:00 AM – 10:00 AM" },
  { id: "tomorrow-mid", label: "Tomorrow", time: "10:00 AM – 12:00 PM" },
  { id: "tomorrow-afternoon", label: "Tomorrow", time: "2:00 PM – 4:00 PM" },
  { id: "day-after-morning", label: "Day after", time: "8:00 AM – 10:00 AM" },
];

const PRO = {
  name: "Mike Rodriguez",
  rating: 4.8,
  experience: "12 years",
  title: "Licensed Master Plumber",
  license: "MA #PL-28451",
};

export default function QuotePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      const res = await getQuote(sessionId);
      if (res.error || !res.data) {
        setError("Could not load your quote. Please go back and try again.");
      } else {
        setQuote(res.data);
      }
      setIsLoading(false);
    };
    fetchQuote();
  }, [sessionId]);

  const handleContinue = () => {
    if (!quote || !selectedSlot) return;
    const slot = TIME_SLOTS.find((s) => s.id === selectedSlot);
    // Store quote + slot data for the booking page
    sessionStorage.setItem(
      `hb_booking_${sessionId}`,
      JSON.stringify({
        quote,
        slot,
        pro: PRO,
      })
    );
    router.push(`/book/${sessionId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-warm-white flex flex-col">
        <DemoNavbar step="quote" />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-red-600 font-medium mb-4">{error || "Something went wrong."}</p>
            <button onClick={() => router.push("/chat")} className="text-amber underline text-sm">
              Start over
            </button>
          </div>
        </div>
      </div>
    );
  }

  const priceDollars = (quote.quoted_price_cents / 100).toFixed(0);
  const tierLabel =
    quote.confidence_tier === "tier1"
      ? "Guaranteed Price"
      : quote.confidence_tier === "tier2"
      ? "Most Likely Price"
      : "Estimated Price";

  return (
    <div className="min-h-screen bg-warm-white flex flex-col">
      <DemoNavbar step="quote" />

      <div className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left — Quote Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-warm-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-navy mb-1">{quote.job_code.name}</h2>
                <p className="text-sm text-gray-500 mb-6">{quote.job_code.description}</p>

                {/* Diagnosis summary */}
                {quote.diagnosis_summary && (
                  <div className="bg-amber-light/50 border border-amber/20 rounded-xl p-4 mb-6">
                    <p className="text-sm text-navy font-medium">AI Diagnosis</p>
                    <p className="text-sm text-gray-600 mt-1">{quote.diagnosis_summary}</p>
                  </div>
                )}

                {/* Price */}
                <div className="bg-navy rounded-2xl p-6 mb-6 text-center">
                  <p className="text-xs text-white/60 uppercase tracking-wide font-medium mb-2">
                    {tierLabel}
                  </p>
                  <p className="text-5xl font-black text-white">${priceDollars}</p>
                  <p className="text-sm text-white/70 mt-1">No surprise bills. Ever.</p>
                </div>

                {/* No-Surprise Guarantee */}
                <div className="flex items-center gap-3 bg-green/10 border border-green/20 rounded-xl p-3 mb-6">
                  <svg className="w-5 h-5 text-green flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-green">No-Surprise Guarantee</p>
                    <p className="text-xs text-gray-500">This price is locked in. If the job takes longer, we cover it.</p>
                  </div>
                </div>

                {/* Price breakdown */}
                {quote.price_breakdown.length > 1 && (
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Price Breakdown</p>
                    <div className="space-y-1">
                      {quote.price_breakdown.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-medium text-navy">
                            {i === 0 ? "" : "+"}${(item.amount_cents / 100).toFixed(0)}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
                        <span className="font-semibold text-navy">Total</span>
                        <span className="font-bold text-navy">${priceDollars}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* What's included */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">What&apos;s Included</p>
                  <ul className="space-y-2">
                    {quote.whats_included.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-green flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                        {item}
                      </li>
                    ))}
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-green flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      Licensed &amp; insured plumber
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-green flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      30-day workmanship warranty
                    </li>
                  </ul>
                </div>

                <p className="text-xs text-gray-400 mt-4 text-center">
                  ~{quote.job_code.estimated_duration_min} minutes estimated
                </p>
              </div>
            </div>

            {/* Right — Time slots + Pro card */}
            <div className="space-y-6">
              {/* Time slots */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-warm-lg p-6">
                <h3 className="text-lg font-bold text-navy mb-4">Choose a time</h3>
                <div className="space-y-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
                        selectedSlot === slot.id
                          ? "border-amber bg-amber-light/50 text-navy ring-1 ring-amber/30"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="font-medium">{slot.label}</span>
                      <span className={selectedSlot === slot.id ? "text-amber font-semibold" : "text-gray-500"}>
                        {slot.time}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pro card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-warm-lg p-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Your Pro</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-navy flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    MR
                  </div>
                  <div>
                    <p className="font-bold text-navy">{PRO.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <svg className="w-4 h-4 text-amber" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-navy">{PRO.rating}</span>
                      <span className="text-sm text-gray-400 ml-1">{PRO.experience} experience</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{PRO.title} · {PRO.license}</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={handleContinue}
                disabled={!selectedSlot}
                className="w-full bg-amber hover:bg-amber/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Continue to Booking
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
