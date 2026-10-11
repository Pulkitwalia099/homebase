import Navigation from "@/components/golocal/Navigation";
import Footer from "@/components/golocal/Footer";
import AgentEcosystem from "@/components/golocal/AgentEcosystem";
import BookingDemo from "@/components/golocal/BookingDemo";
export default function Page() { return <><Navigation /><main id="main" className="gl-container gl-demo-page"><p className="gl-eyebrow">EXPLORE THE BOOKING JOURNEY</p><h1>Your local agent.<br /><em>Already in your messages.</em></h1><p>A text. A photo. A local visit sorted. Watch this illustrative iMessage conversation with an OpenClaw agent, then choose a provider and approve the example booking.</p><BookingDemo /><AgentEcosystem /></main><Footer /></>; }
