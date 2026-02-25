"use client";

import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/Button";

interface StripeCardFormProps {
  clientSecret: string;
  jobId: string;
  quotedPriceCents: number;
  onSuccess: () => void;
}

const BOOKING_FEE_CENTS = 3500; // $35

export function StripeCardForm({
  clientSecret,
  jobId,
  quotedPriceCents,
  onSuccess,
}: StripeCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setErrorMessage("Card element not found. Please refresh and try again.");
      setIsProcessing(false);
      return;
    }

    // Confirm the SetupIntent to save the card
    const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (error) {
      setErrorMessage(error.message || "Payment failed. Please try again.");
      setIsProcessing(false);
      return;
    }

    // Tell the backend to charge the $35 booking fee and confirm the job
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payments/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_id: jobId,
            payment_method_id: setupIntent?.payment_method,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data?.error?.message || "Payment confirmation failed.");
        return;
      }

      onSuccess();
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const bookingFeeDollars = (BOOKING_FEE_CENTS / 100).toFixed(0);
  const finalChargeDollars = (quotedPriceCents / 100).toFixed(0);

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card details
        </label>
        <div className="border border-gray-300 rounded-xl px-4 py-3 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "14px",
                  color: "#111827",
                  fontFamily: "inherit",
                  "::placeholder": { color: "#9CA3AF" },
                },
                invalid: { color: "#EF4444" },
              },
            }}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Charge summary */}
      <div className="bg-gray-50 rounded-xl px-4 py-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Booking fee (charged now)</span>
          <span className="font-semibold text-gray-900">${bookingFeeDollars}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Job completion charge</span>
          <span className="font-semibold text-gray-900">${finalChargeDollars}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between">
          <span className="text-gray-500 text-xs">Card saved for final charge on completion</span>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleSubmit}
        loading={isProcessing}
        disabled={!stripe || isProcessing}
      >
        Pay ${bookingFeeDollars} Booking Fee & Confirm
      </Button>

      <p className="text-xs text-gray-400 text-center">
        Your card is securely processed by Stripe. HomeBase never stores card numbers.
      </p>
    </div>
  );
}
