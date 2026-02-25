import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join as a Licensed Plumber in Boston — Confirmed Jobs, Fair Pay",
  description:
    "Apply to join the HomeBase network. Get confirmed plumbing jobs in Boston — no shared leads, guaranteed pricing, and same-week payouts. Licensed plumbers only.",
  openGraph: {
    title: "Join as a Licensed Plumber in Boston — Confirmed Jobs, Fair Pay",
    description:
      "Get confirmed plumbing jobs in Boston. No shared leads, guaranteed pricing, same-week payouts.",
  },
};

export default function ProsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
