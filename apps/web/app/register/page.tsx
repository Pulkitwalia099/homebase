import Navigation from "@/components/golocal/Navigation";
import Footer from "@/components/golocal/Footer";
import RegistrationForm from "@/components/golocal/RegistrationForm";

export const metadata = { title: "Join the GoLocal network", description: "Join the live customer pilot, register a local business, or partner with GoLocal.", alternates: { canonical: "/register" } };
export default async function Page({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const initialType = type === "customer" || type === "agent" || type === "partner" ? type : "business";
  return <><Navigation /><main id="main" className="gl-container gl-register"><div className="gl-register-intro"><p className="gl-eyebrow">LET’S GET ACQUAINTED</p><h1>{initialType === "customer" ? <>Your agent.<br /><em>Your first local chapter.</em></> : <>A local network.<br /><em>With you in it.</em></>}</h1><p>{initialType === "customer" ? "The pilot is live and onboarding customers. Join through your personal agent and help us make local bookings feel effortless." : "Tell us a little about your business. We’ll explore where you fit and how we can build together."}</p><div className="gl-register-aside"><h2>What happens next?</h2><p>{initialType === "customer" ? "We’ll save your signup. Connect your own agent today; we’ll contact you when the real pilot is available in your area. Salt Lake City plumbing is our starting point." : "We review your registration, follow up about your needs and discuss the right pilot or partnership. Suppliers create their own account and profile, then test requests before activation."}</p><a href="mailto:pulkitwalia099@gmail.com">Prefer a conversation? Email our team ↗</a></div></div><RegistrationForm initialType={initialType} /></main><Footer /></>;
}
