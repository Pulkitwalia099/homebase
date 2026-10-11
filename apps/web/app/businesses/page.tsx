import AudiencePage from "@/components/golocal/AudiencePage";
export const metadata = { title: "For local businesses", description: "Register your local service business for GoLocal. Connect with personal agents through the software and booking workflows you already use.", alternates: { canonical: "/businesses" } };
export default function Page() { return <AudiencePage audience="business" />; }
