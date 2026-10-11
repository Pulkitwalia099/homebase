import Navigation from "@/components/golocal/Navigation";
import Footer from "@/components/golocal/Footer";
import RegistrationForm from "@/components/golocal/RegistrationForm";
import type { Audience } from "@/components/golocal/AudiencePage";
export const metadata = { title: "Join the GoLocal network", description: "Register your business or partner with GoLocal as an agent company or channel partner.", alternates: { canonical: "/register" } };
export default async function Page({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const initialType: Audience = type === "agent" || type === "partner" ? type : "business";
  return <><Navigation /><main id="main" className="gl-container gl-register"><div className="gl-register-intro"><p className="gl-eyebrow">LET’S GET ACQUAINTED</p><h1>A local network.<br /><em>With you in it.</em></h1><p>Tell us a little about your business. We’ll explore where you fit and how we can build together.</p><div className="gl-register-aside"><h2>What happens next?</h2><p>We review your registration, follow up about your needs and discuss the right pilot or partnership. Connection details and commercial terms come before any commitment.</p><a href="mailto:pulkitwalia099@gmail.com">Prefer a conversation? Email our team ↗</a></div></div><RegistrationForm initialType={initialType} /></main><Footer /></>;
}
