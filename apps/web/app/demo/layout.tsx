import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Try Our Plumbing Scoping Demo — AI-Powered Diagnosis",
  description:
    "See how HomeBase's AI agent diagnoses plumbing issues in real time. Describe your problem, get an instant scope and guaranteed price quote for Boston plumbing services.",
  openGraph: {
    title: "Try Our Plumbing Scoping Demo — AI-Powered Diagnosis",
    description:
      "See how HomeBase's AI agent diagnoses plumbing issues in real time. Instant scope and guaranteed price quote.",
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
