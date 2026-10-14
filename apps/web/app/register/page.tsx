import Navigation from "@/components/golocal/Navigation";
import Footer from "@/components/golocal/Footer";
import RegistrationForm from "@/components/golocal/RegistrationForm";

export const metadata = { title: "Join the GoLocal network", description: "Join the live customer pilot, register a local business, or partner with GoLocal.", alternates: { canonical: "/register" } };
export default async function Page({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const initialType = type === "customer" || type === "agent" || type === "partner" ? type : "business";
  return <><Navigation /><main id="main" className="gl-container gl-register"><div className="gl-register-intro"><p className="gl-eyebrow">JOIN THE LIVE NETWORK</p><h1>{initialType === "customer" ? <>Local services.<br /><em>Through your AI agent.</em></> : <>Your next customers.<br /><em>Through personal agents.</em></>}</h1><p>{initialType === "customer" ? "Give your personal agent a connection to the local businesses that get things done. Register your city and service needs to join the live pilot." : "Register your business for a new customer channel through personal AI agents. Share your services and existing tools so we can review the right GoLocal connection."}</p><div className="gl-register-aside"><h2>What happens next?</h2><p>{initialType === "customer" ? "We’ll confirm coverage and help you connect your agent to the pilot. You can try an example booking today. Current onboarding starts with Salt Lake City plumbing." : "We review your registration, follow up about your needs and discuss the right pilot or partnership. Suppliers create their own account and profile, then test requests before activation."}</p><a href="mailto:pulkitwalia099@gmail.com">Prefer a conversation? Email our team ↗</a></div></div><RegistrationForm initialType={initialType} /></main><Footer /></>;
}
