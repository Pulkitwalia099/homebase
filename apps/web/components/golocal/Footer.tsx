import Link from "next/link";
import Logo from "./Logo";
export default function Footer() {
  return <footer className="gl-footer"><div className="gl-container"><div className="gl-footer-top"><div><Logo light /><p>Local services, booked by your personal agent.</p></div><div className="gl-footer-links"><Link href="/businesses">Businesses</Link><Link href="/agents">Agent partners</Link><Link href="/partners">Channel partners</Link><a href="mailto:pwalia@mba2027.hbs.edu">Contact us ↗</a></div></div><div className="gl-footer-bottom"><span>© {new Date().getFullYear()} GoLocal</span><span>Built for the people who get things done.</span><Link href="/privacy">Privacy</Link></div></div></footer>;
}
