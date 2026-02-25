"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { StripeCardForm } from "@/components/payment/StripeCardForm";
import { Card } from "@/components/ui/Card";

export default function BookingPaymentPage({ params }: { params: { jobId: string } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);

  const clientSecret = searchParams.get("cs") || "";
  const quotedPriceCents = parseInt(searchParams.get("price") || "0");

  const handleSuccess = () => {
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card padding="lg" className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 text-sm mb-4">
            We're finding the best plumber for your job. You'll receive a text confirmation within 30 minutes once a pro accepts.
          </p>
          <p className="text-xs text-gray-400">
            Check your text messages for updates.
          </p>
        </Card>
      </div>
    );
  }

  // Sprint 3: Stripe is added in Sprint 4. When client_secret is absent the
  // booking was still created in the DB — show the success card directly.
  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card padding="lg" className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Booking Received!</h1>
          <p className="text-gray-600 text-sm mb-4">
            We&apos;re finding the best plumber for your job. You&apos;ll receive a text confirmation within 30 minutes once a pro accepts.
          </p>
          <p className="text-xs text-gray-400">Check your text messages for updates.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <Card padding="lg" className="max-w-md w-full">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Secure Payment</h1>
        <p className="text-sm text-gray-500 mb-6">
          A $35 booking fee is charged now. The remaining balance is charged when your job is complete.
        </p>
        <Elements stripe={getStripe()} options={{ clientSecret }}>
          <StripeCardForm
            clientSecret={clientSecret}
            jobId={params.jobId}
            quotedPriceCents={quotedPriceCents}
            onSuccess={handleSuccess}
          />
        </Elements>
      </Card>
    </div>
  );
}
