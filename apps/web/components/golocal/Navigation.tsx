import Link from "next/link";
import Logo from "./Logo";
export default function Navigation() {
  return <header className="gl-header gh-header"><a className="gl-skip" href="#main">Skip to content</a><div className="gl-container gl-nav"><Logo /><Link className="gl-button gl-button-small gl-nav-cta" href="/agent">For personal AI agents <span aria-hidden="true">↗</span></Link></div></header>;
}
