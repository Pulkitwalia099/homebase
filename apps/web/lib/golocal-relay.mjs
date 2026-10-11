import { createHash, timingSafeEqual } from 'node:crypto';

const UPSTREAM = 'https://camryn-mechanomorphic-ellis.ngrok-free.dev';
const PUBLIC_BASE = 'https://getgolocal.com/api/connector';
const TOOLS = new Set(['connector_status', 'housecall_company', 'housecall_list_jobs', 'prepare_housecall_test_booking', 'confirm_housecall_test_booking', 'housecall_test_booking_status', 'unschedule_housecall_test_booking']);
const LIMIT = 32768;
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
const result = (body, status = 200) => Response.json(body, { status, headers });

async function boundedBody(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Invalid body');
  let length = 0; const chunks = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > LIMIT) { await reader.cancel(); throw new Error('Body too large'); }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  const body = Buffer.concat(chunks).toString('utf8');
  const parsed = JSON.parse(body);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid body');
  return body;
}

// This relay holds only a credential verifier. The vendor key and durable state stay upstream.
export function createGoLocalRelay({ keyHash, expiresAt, fetchFn = fetch, now = Date.now }) {
  return async function relay(request, path) {
    const url = new URL(request.url);
    if (url.search) return result({ code: 'INVALID_INPUT' }, 400);
    const route = path.join('/');
    if (request.method === 'GET' && route === 'health') return result({ service: 'GoLocal', environment: 'private pilot', relay: true, vendorAccess: 'credential required' });
    const publicDocs = request.method === 'GET' && route === 'integration';
    const discovery = request.method === 'GET' && route === 'tools';
    const call = request.method === 'POST' && path.length === 2 && path[0] === 'tools' && TOOLS.has(path[1]);
    if (!publicDocs && !discovery && !call) return result({ code: 'NOT_FOUND' }, 404);
    if (!publicDocs) {
      const deadline = Date.parse(expiresAt || '');
      if (!/^[a-f0-9]{64}$/.test(keyHash || '') || !Number.isFinite(deadline) || deadline > now() + 86400000) return result({ code: 'RELAY_DISABLED' }, 503);
      if (deadline <= now()) return result({ code: 'ACCESS_EXPIRED' }, 401);
      const authorization = request.headers.get('authorization') || '';
      const token = authorization.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
      if (!token || !timingSafeEqual(Buffer.from(createHash('sha256').update(token).digest('hex')), Buffer.from(keyHash))) return result({ code: 'UNAUTHORIZED' }, 401);
      const origin = request.headers.get('origin');
      if (origin && origin !== 'https://getgolocal.com') return result({ code: 'ORIGIN_DENIED' }, 403);
    }
    let body;
    if (call) {
      if (!request.headers.get('content-type')?.startsWith('application/json')) return result({ code: 'INVALID_INPUT' }, 400);
      try { body = await boundedBody(request); } catch { return result({ code: 'INVALID_INPUT' }, 400); }
    }
    const target = publicDocs ? '/integration' : discovery ? '/api/tools' : `/api/tools/${path[1]}`;
    const outboundHeaders = { Accept: 'application/json' };
    if (!publicDocs) outboundHeaders.Authorization = request.headers.get('authorization');
    if (call) outboundHeaders['Content-Type'] = 'application/json';
    try {
      const upstream = await fetchFn(UPSTREAM + target, { method: call ? 'POST' : 'GET', headers: outboundHeaders, body, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(20000) });
      const data = await upstream.json();
      if (publicDocs) {
        if (!upstream.ok || !Array.isArray(data.tools) || data.backend !== 'housecall') throw new Error('Unavailable documentation');
        return result({ name: 'GoLocal', environment: 'private Housecall test pilot', api: { listTools: PUBLIC_BASE + '/tools', callTool: PUBLIC_BASE + '/tools/{name}', method: 'POST', body: 'Exact tool input-schema JSON object', auth: 'Authorization: Bearer <securely stored GoLocal test credential>' }, permissions: 'Seven bounded tools; approve each write. One-day existing credential only. Vendor key remains on the local GoLocal backend.', constraints: ['One bound test company, fictional customers and $0 synthetic jobs.', 'No service fulfillment, messages, dispatch, work-start or payments.', 'Schedule removal does not cancel the job.', 'No automatic retry after unknown write outcome.', 'Relay still depends on the local server and ngrok tunnel.'], tools: data.tools.filter(t => TOOLS.has(t.name)).map(t => ({ name: t.name, description: t.description, annotations: t.annotations, inputSchema: t.inputSchema })) });
      }
      return result(data, upstream.status);
    } catch {
      // A timeout may occur after the upstream wrote. Never resend the request here.
      return result({ code: call ? 'UPSTREAM_OUTCOME_UNKNOWN' : 'UPSTREAM_UNAVAILABLE', retryAutomatically: false }, 502);
    }
  };
}
