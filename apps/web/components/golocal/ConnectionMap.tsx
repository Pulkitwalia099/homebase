"use client";
import { useState } from "react";
import Image from "next/image";
const nodes = [
  { label: "Personal agents", small: "CUSTOMER REQUEST", icon: "✳", title: "The request starts with an agent.", description: "A customer describes what they need. Their agent gathers the job details, location and timing, then asks GoLocal for suitable options." },
  { label: "GoLocal", small: "SHARED BOOKING LAYER", icon: "logo", title: "One place to discover and book.", description: "GoLocal is designed to give connected agents structured services, prices and availability from participating businesses, with booking actions the business has authorized." },
  { label: "Business software", small: "AUTHORIZED CONNECTION", icon: "▤", title: "Connect the systems businesses already use.", description: "Each integration translates the provider’s services and booking workflow into a consistent format. Platform support and business permission are verified separately." },
  { label: "Local businesses", small: "REAL-WORLD SERVICE", icon: "⌂", title: "Local expertise stays local.", description: "The business defines its services, coverage and booking rules, then carries out the job. Confirmations and updates return through GoLocal to the agent." },
];
export default function ConnectionMap() {
  const [active, setActive] = useState(1);
  return <div className="gl-map"><div className="gl-map-nodes">{nodes.map((n, i) => <div className="gl-map-node-wrap" key={n.label}><button className={`gl-map-node ${active === i ? "is-active" : ""}`} onClick={() => setActive(i)} aria-pressed={active === i}><span className="gl-map-icon">{n.icon === "logo" ? <Image src="/brand/golocal-symbol.png" width={72} height={72} alt="" /> : n.icon}</span><strong>{n.label}</strong><small>{n.small}</small></button>{i < 3 && <span className="gl-map-line" aria-hidden="true"><i />→</span>}</div>)}</div><div className="gl-map-detail" aria-live="polite"><span className="gl-mono">0{active + 1} / THE CONNECTION</span><div><h3>{nodes[active].title}</h3><p>{nodes[active].description}</p></div></div><p className="gl-map-footnote">Planned network architecture. Initial pilot onboarding is underway.</p></div>;
}
