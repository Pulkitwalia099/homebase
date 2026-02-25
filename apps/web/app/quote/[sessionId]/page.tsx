"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QuoteCard } from "@/components/quote/QuoteCard";
import { BookingForm } from "@/components/quote/BookingForm";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getQuote, createBooking } from "@/lib/api-client";
import type { QuoteData, BookingRequest } from "@/lib/types";

export default function QuotePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleBooking = async (bookingData: BookingRequest) => {
    setIsSubmitting(true);
    try {
      const res = await createBooking(bookingData);
      if (res.error || !res.data) {
        setError("Failed to create booking. Please try again.");
        return;
      }
      // Navigate to payment page with job_id and client_secret
      const { job_id, client_secret, quoted_price_cents } = res.data;
      router.push(
        `/booking/${job_id}?cs=${encodeURIComponent(client_secret)}&price=${quoted_price_cents}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">{error || "Something went wrong."}</p>
          <button
            onClick={() => router.push("/chat")}
            className="text-blue-600 underline text-sm"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-6"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left — quote summary */}
          <QuoteCard quote={quote} />

          {/* Right — booking form */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Book this job</h2>
            <BookingForm
              quote={quote}
              onSubmit={handleBooking}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
