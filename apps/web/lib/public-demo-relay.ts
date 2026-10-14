const upstream = 'https://camryn-mechanomorphic-ellis.ngrok-free.dev';
export const demoToolNames = ['connector_status', 'scope_request', 'search_providers', 'get_availability', 'prepare_booking', 'confirm_booking', 'get_booking_status'];
// This relay has no bearer token. It cannot reach the private account MCP or CRM.
export async function relayDemo(request: Request, path: string, upstreamFetch: typeof fetch = fetch) {
  if (!request.headers.get('content-type')?.includes('application/json')) return Response.json({ error: 'JSON required.' }, { status: 415 });
  if (Number(request.headers.get('content-length') || 0) > 16000) return Response.json({ error: 'Request too large.' }, { status: 413 });
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 16000) return Response.json({ error: 'Request too large.' }, { status: 413 });
  try { JSON.parse(raw); } catch { return Response.json({ error: 'Invalid JSON.' }, { status: 400 }); }
  try {
    const response = await upstreamFetch(`${upstream}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'ngrok-skip-browser-warning': 'true', ...(request.headers.get('mcp-protocol-version') ? { 'mcp-protocol-version': request.headers.get('mcp-protocol-version')! } : {}) }, body: raw, signal: AbortSignal.timeout(12000), cache: 'no-store', redirect: 'error' });
    // JSON-RPC notifications have an empty 202/204 acknowledgement, not a JSON body.
    if ([202, 204].includes(response.status)) return new Response(null, { status: response.status, headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } });
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('InvalidDemoResponse');
    return new Response(await response.text(), { status: response.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } });
  } catch { return Response.json({ error: 'The agent demo is temporarily offline. Please retry or contact the pilot team.', simulated: true }, { status: 503 }); }
}
