import { agentReadme } from '@/lib/agent-documentation';
const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GoLocal / agent</title><style>body{margin:40px auto;padding:0 24px;max-width:920px;color:#202b24;background:white;font:14px/1.7 ui-monospace,SFMono-Regular,Consolas,monospace}h1{font-size:22px;line-height:1.4}h2{font-size:15px;margin-top:30px}a{color:#245943;text-underline-offset:3px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}nav{margin-bottom:30px;font-size:12px}hr{border:0;border-top:1px solid #dce3dc;margin:24px 0}.note{font-size:12px;color:#68746a}@media(max-width:600px){body{margin-top:25px;padding:0 18px;font-size:12px}}a:focus-visible{outline:2px solid #df704b;outline-offset:4px}</style></head><body><nav><a href="/">Human view</a> / <a href="/agent/files/README.md">Raw Markdown</a></nav><main><h1>GoLocal / agent</h1><p>Local-service discovery and booking tools for personal AI agents.</p><p class="note">Live pilot. Onboarding customers and businesses.</p><hr><h2>Files</h2><ul><li><a href="/agent/files/README.md">README.md</a> — overview and quick start</li><li><a href="/agent/files/SKILL.md">SKILL.md</a> — instructions for an agent</li><li><a href="/llms.txt">llms.txt</a> — documentation index</li><li><a href="/agent/files/mcp-config.json">mcp-config.json</a> — connection configuration</li><li><a href="/agent/files/capabilities.json">capabilities.json</a> — tools and limits</li></ul><h2>Quick start</h2><pre>server:         GoLocal Demo
transport:      Streamable HTTP
endpoint:       https://getgolocal.com/demo/mcp
authentication: none

Initialize MCP, list tools, then call connector_status.</pre><h2>Workflow</h2><pre>scope_request
  → search_providers
  → get_availability
  → prepare_booking
  → customer approval
  → confirm_booking
  → get_booking_status</pre><h2>Current boundaries</h2><pre>Public demo: fictional plumbers, example prices and appointments.
No actual service, supplier-account access or payment.
Execution depends on the pilot machine and tunnel.
Client-specific configuration formats vary.</pre><h2>Supplier-connected customer pilot</h2><p><a href="/connectors?flow=pilot">OAuth setup and customer account instructions</a></p><p>Use the separate connection to submit a test request to a participating supplier. Confirmation follows supplier acceptance. Real-service availability is confirmed during onboarding.</p><hr><p><a href="/connectors">Human setup guide</a></p></main></body></html>`;
export function GET(request: Request) {
  const accept = request.headers.get('accept') || '';
  if (accept.includes('text/plain') || accept.includes('text/markdown')) return new Response(agentReadme, { headers: { 'Content-Type': 'text/plain; charset=utf-8', Vary: 'Accept' } });
  return new Response(page, { headers: { 'Content-Type': 'text/html; charset=utf-8', Vary: 'Accept', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'self'", Link: '</llms.txt>; rel="describedby"; type="text/plain"' } });
}
