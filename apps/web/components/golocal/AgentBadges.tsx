import Image from 'next/image';
import Link from 'next/link';
export function AgentIcons() {
  return <span className="gl-map-agent-icons" aria-hidden="true"><Image src="/agents/chatgpt.png" alt="" width={30} height={30} /><Image src="/agents/claude.png" alt="" width={30} height={30} /></span>;
}
export default function AgentBadges() {
  return <div className="gl-mini-agents" aria-label="Choose your personal agent setup"><Link href="/connectors?agent=chatgpt"><Image src="/agents/chatgpt.png" alt="" width={22} height={22} /><span>ChatGPT<small>Pilot tested</small></span></Link><Link href="/connectors?agent=claude"><Image src="/agents/claude.png" alt="" width={22} height={22} /><span>Claude<small>Setup guide</small></span></Link><Link href="/connectors?agent=other"><span className="gl-mini-agent-other" aria-hidden="true">⌘</span><span>Other agents<small>MCP setup</small></span></Link></div>;
}
