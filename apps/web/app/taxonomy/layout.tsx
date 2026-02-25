import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plumbing Job Code Taxonomy — Standardized Service Catalog",
  description:
    "Explore HomeBase's structured taxonomy of plumbing job codes. Every service — from faucet repair to water heater installation — classified, scoped, and priced for Boston.",
  openGraph: {
    title: "Plumbing Job Code Taxonomy — Standardized Service Catalog",
    description:
      "Structured taxonomy of plumbing job codes. Every service classified, scoped, and priced for Boston.",
  },
};

export default function TaxonomyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
