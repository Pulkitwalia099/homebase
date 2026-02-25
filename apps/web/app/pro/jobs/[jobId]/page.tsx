"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { ProJobCard } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1";

export default function ProJobCardPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [job, setJob] = useState<ProJobCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(
          `${API_URL}/pros/jobs/${jobId}?token=${encodeURIComponent(token)}`
        );
        if (!res.ok) {
          setError("Job not found or this link has expired.");
          return;
        }
        const data = await res.json();
        setJob(data.data || data);
      } catch {
        setError("Failed to load job details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchJob();
  }, [jobId, token]);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const res = await fetch(`${API_URL}/pros/jobs/${jobId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data?.error?.message || "Failed to accept job.");
        return;
      }
      setAccepted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card padding="lg" className="max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Job Accepted</h2>
          <p className="text-sm text-gray-600">
            The customer has been notified. You'll receive a reminder the morning of the job.
          </p>
        </Card>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">{error || "Job not found."}</p>
          <p className="text-gray-500 text-sm">This link may have expired. Contact HomeBase support.</p>
        </div>
      </div>
    );
  }

  const priceDollars = (job.quoted_price_cents / 100).toFixed(0);

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            HB
          </div>
          <div>
            <h1 className="font-bold text-gray-900">HomeBase Job Request</h1>
            <p className="text-xs text-gray-500">Review and accept to confirm</p>
          </div>
        </div>

        {/* Job summary */}
        <Card padding="md">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-bold text-lg text-gray-900">{job.service_name}</h2>
              <Badge label={job.status === "pending_pro_accept" ? "Awaiting Response" : job.status} variant="yellow" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-blue-700">${priceDollars}</p>
              <p className="text-xs text-gray-500">guaranteed price</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">{job.service_description}</p>
        </Card>

        {/* Customer & location */}
        <Card padding="md">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Job Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">{job.address.street}</p>
                <p className="text-gray-500">{job.address.city}, {job.address.state} {job.address.zip}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
              </svg>
              <p className="text-gray-700">{job.scheduled_date} · {job.scheduled_window}</p>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
              </svg>
              <p className="text-gray-700">{job.customer_display_name} · {job.customer_phone_masked}</p>
            </div>
          </div>
        </Card>

        {/* Photos */}
        {job.photos && job.photos.length > 0 && (
          <Card padding="md">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Customer Photos</h3>
            <div className="grid grid-cols-3 gap-2">
              {job.photos.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`Job photo ${i + 1}`}
                  className="rounded-lg w-full aspect-square object-cover"
                />
              ))}
            </div>
          </Card>
        )}

        {/* Scoping notes */}
        {job.scoping_notes && (
          <Card padding="md">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Diagnosis Notes</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{job.scoping_notes}</p>
          </Card>
        )}

        {/* CTA */}
        {!declined && (
          <div className="space-y-2 pb-6">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleAccept}
              loading={isAccepting}
            >
              Accept Job — ${priceDollars}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="w-full text-gray-500"
              onClick={() => setDeclined(true)}
              disabled={isAccepting}
            >
              I can't do this job
            </Button>
          </div>
        )}

        {declined && (
          <Card padding="md" className="text-center">
            <p className="text-sm text-gray-600">
              Got it. We'll find another plumber for this job.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
