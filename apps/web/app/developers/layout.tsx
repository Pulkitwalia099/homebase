import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plumbing Services API for Developers — Scope, Price & Book",
  description:
    "Build with the HomeBase API. Scope plumbing issues, generate guaranteed-price quotes, and book licensed Boston plumbers — all programmatically. REST API, MCP server, and agent skill.",
  openGraph: {
    title: "Plumbing Services API for Developers — Scope, Price & Book",
    description:
      "Scope plumbing issues, generate quotes, and book licensed Boston plumbers programmatically.",
  },
};

export default function DevelopersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
