import Navigation from "@/components/golocal/Navigation";
import Footer from "@/components/golocal/Footer";
import BookingDemo from "@/components/golocal/BookingDemo";
export default function Page() { return <><Navigation /><main id="main" className="gl-container gl-demo-page"><p className="gl-eyebrow">EXPLORE THE BOOKING JOURNEY</p><h1>A request becomes<br /><em>a local appointment.</em></h1><p>Watch the conversation unfold. Pick a provider, approve the example visit, or let your agent take you all the way through. This interactive demo shows the experience we’re building.</p><BookingDemo /></main><Footer /></>; }
