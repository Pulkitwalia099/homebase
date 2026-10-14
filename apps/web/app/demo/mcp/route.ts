import { relayDemo } from '@/lib/public-demo-relay';
export const runtime = 'nodejs';
export const maxDuration = 20;
export const POST = (request: Request) => relayDemo(request, '/demo/mcp');
export const GET = () => Response.json({ name: 'GoLocal Demo', transport: 'Streamable HTTP', authentication: 'none', simulated: true, setup: 'https://getgolocal.com/connectors', message: 'Connect using POST. Fictional demo data only.' }, { status: 405, headers: { Allow: 'POST' } });
export const OPTIONS = () => new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type, mcp-protocol-version' } });
