import express from 'express';
import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod/v4';
import { makeServer, makeTools } from './tools.js';
import { PilotError } from './jobber.js';
import { AgentOAuth, DEMO_SCOPE } from './agent-oauth.js';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';

const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const equal = (a, b) => typeof a === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const page = (title, body) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(title)}</title><style>body{font:17px system-ui;background:#f5f2e9;color:#193c32;max-width:780px;padding:32px;margin:auto}input,button{font:inherit;padding:10px;margin:8px 0}button{cursor:pointer}pre{white-space:pre-wrap}label{display:block}a{color:#193c32}</style></head><body><h1>${escape(title)}</h1>${body}</body></html>`;

export function createApp(context) {
  const { config, store, jobber } = context;
  const app = express();
  app.disable('x-powered-by');
  const sessions = new Map(); const limits = new Map();
  const agentOAuth = new AgentOAuth(store,config);
  app.use((req, res, next) => {
    // Preserve Origin on same-origin browser form POSTs; suppress cross-origin referrers.
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self' https://api.getjobber.com https://chatgpt.com; frame-ancestors 'none'; base-uri 'none'" });
    if (!config.allowedHosts.has(req.get('host'))) return res.status(403).send('Host not allowed. Set PUBLIC_BASE_URL to the exact HTTPS tunnel origin.');
    const origin = req.get('origin');
    if (origin && origin !== config.baseUrl && !config.allowedOrigins.includes(origin)) return res.status(403).send('Origin not allowed.');
    const now = Date.now(); const current = limits.get(req.ip);
    if (!current || current.until < now) limits.set(req.ip, { until: now + 60000, n: 1 });
    else if (++current.n > 120) return res.status(429).send('Too many requests; wait one minute.');
    if (limits.size > 1000) for (const [ip, value] of limits) if (value.until < now) limits.delete(ip);
    next();
  });
  app.use(express.json({ limit: '32kb' }));
  app.use(express.urlencoded({ extended: false, limit: '4kb' }));
  if (config.dotsOAuth) app.use(mcpAuthRouter({ provider: agentOAuth, issuerUrl: new URL(config.baseUrl), resourceServerUrl: new URL(`${config.baseUrl}/mcp`),
    scopesSupported: [agentOAuth.scope], resourceName: config.backend==='housecall'?'GoLocal Housecall test jobs':'GoLocal simulated booking test', serviceDocumentationUrl: new URL(`${config.baseUrl}/integration`), clientRegistrationOptions: { clientSecretExpirySeconds: 0 } }));
  const auth = async (req, res, next) => {
    const muse=config.museAccess;
    if(muse && equal(req.get('authorization'),`Bearer ${muse.token}`) && config.backend==='housecall' && config.housecall?.companyId===muse.companyId && config.baseUrl===muse.baseUrl && Date.now()<muse.expiresAt) return next();
    if (equal(req.get('authorization'), `Bearer ${config.mcpToken}`)) return next();
    const token = req.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    const hosted=config.hostedAccess;
    if (token && hosted && config.hosted && !store.state.hostedCredentialRevoked && config.backend==='housecall' && config.housecall?.companyId===hosted.companyId && config.baseUrl===hosted.baseUrl && equal(createHash('sha256').update(token).digest('hex'),hosted.keyHash)) return next();
    if (config.dotsOAuth && token) { try { await agentOAuth.verifyAccessToken(token); return next(); } catch {} }
    res.status(401).set('WWW-Authenticate', config.dotsOAuth ? `Bearer resource_metadata="${config.baseUrl}/.well-known/oauth-protected-resource/mcp", scope="${agentOAuth.scope}"` : 'Bearer realm="GoLocal private pilot"').json({ error: 'Authentication required' });
  };
  const getSession = req => {
    const cookie = req.get('cookie')?.split(';').map(c => c.trim()).find(c => c.startsWith('golocal_operator='))?.slice(17);
    const session = sessions.get(cookie);
    return session?.expiresAt > Date.now() ? session : null;
  };
  const operator = (req, res, next) => {
    req.operator = getSession(req);
    if (!req.operator) return res.status(401).send(page('Operator sign-in', `<p>Read ADMIN_TOKEN from the private local .env file and enter it here.</p><form method="post" action="/operator/login"><input type="hidden" name="returnTo" value="${escape(req.path)}"><label>Operator token <input type="password" name="token" autocomplete="off" required></label><button>Sign in</button></form>`));
    next();
  };
  const csrf = (req, res, next) => equal(req.body.csrf, req.operator.csrf) && (!req.get('origin') || req.get('origin') === config.baseUrl) ? next() : res.status(403).send('Invalid operator form.');
  const form = (req, action, label) => `<form method="post" action="${escape(action)}"><input type="hidden" name="csrf" value="${escape(req.operator.csrf)}"><button>${escape(label)}</button></form>`;
  const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

  app.get('/health', (req, res) => res.json({ ok: true, service: 'golocal-pilot', backend: config.backend }));
  app.get('/', (req, res) => res.send(page('GoLocal connector pilot', '<p>A private connector test for Muse and compatible MCP clients.</p><p><a href="/operator">Operator setup</a> · <a href="/integration">Integration documentation</a></p><p>Demo bookings are simulated. Live bookings and payments are not enabled.</p>')));
  app.get('/integration', (req, res) => res.json({
    name: 'GoLocal', environment: 'private pilot', product: { agentConnection: 'One GoLocal service, configured separately in each personal agent.', supplierAdapters: ['Housecall Pro', 'Jobber'], multiSupplierRoutingImplemented: false }, backend: config.backend, mcp: { url: `${config.baseUrl}/mcp`, transport: 'Streamable HTTP', auth: config.dotsOAuth ? `OAuth authorization-code + S256 PKCE for ${agentOAuth.scope}; private operator-issued bearer key also supported` : 'Bearer token via secure credentials input' },
    api: { listTools: `${config.baseUrl}/api/tools`, callTool: `${config.baseUrl}/api/tools/{name}`, method: 'POST', body: 'JSON object matching the tool input schema', auth: 'Authorization: Bearer <GoLocal agent credential>' },
    privateMuseSetup: { authentication:config.hostedAccess?'Revocable GoLocal bearer credential, restricted to the Housecall test backend, exact company and HTTPS origin. No daily expiry; enter only into a secure credential form.':'Operator-issued GoLocal bearer credential, restricted to the Housecall test backend, exact company and HTTPS origin; expires within one day. Enter only into a secure credential form.', oauthCompatibility:'Current OAuth registration allows ChatGPT callbacks only. Do not use it for Muse.', permissions:'Use platform approval controls for test writes. No supplier API key is exposed.' },
    constraints: ['Single operator and one test business account.', 'Simulated bookings only in demo mode.', 'Real service booking and payments are not implemented; Housecall synthetic scheduling is test-only.', 'Housecall Pro mode permits only bound test company reads and explicitly enabled synthetic $0 test jobs; schedule removal is not job cancellation.', 'Jobber test writes require operator enablement and separate browser approval.', 'Keep secrets out of chat, URLs and tool responses.'],
    tools: makeTools(context).map(t => ({ name: t.name, description: t.description, annotations: t.annotations, inputSchema: z.toJSONSchema(z.object(t.schema).strict()) }))
  }));
  app.get('/api/tools', auth, (req, res) => res.json({ tools: makeTools(context).map(t => ({ name: t.name, description: t.description, annotations: t.annotations, inputSchema: z.toJSONSchema(z.object(t.schema).strict()) })) }));
  app.post('/api/tools/:name', auth, wrap(async (req, res) => {
    const tool = makeTools(context).find(t => t.name === req.params.name);
    if (!tool) return res.status(404).json({ code: 'NOT_FOUND' });
    const args = z.object(tool.schema).strict().safeParse(req.body);
    if (!args.success) return res.status(400).json({ code: 'INVALID_INPUT' });
    res.json(await tool.fn(args.data));
  }));
  app.post('/mcp', auth, wrap(async (req, res) => {
    const server = makeServer(context);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on('close', () => { void transport.close(); void server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }));
  app.all('/mcp', auth, (req, res) => res.status(405).set('Allow', 'POST').json({ error: 'Use Streamable HTTP POST; this pilot is stateless.' }));

  app.post('/operator/login', (req, res) => {
    if (req.get('origin') && req.get('origin') !== config.baseUrl) return res.status(403).send('Invalid login origin.');
    if (!equal(req.body.token, config.adminToken)) return res.status(401).send('Invalid operator token.');
    for (const [id, session] of sessions) if (session.expiresAt < Date.now()) sessions.delete(id);
    if (sessions.size > 20) return res.status(429).send('Too many operator sessions. Restart to clear them.');
    const id = randomBytes(32).toString('hex');
    sessions.set(id, { csrf: randomBytes(32).toString('hex'), expiresAt: Date.now() + 3600000 });
    res.set('Set-Cookie', `golocal_operator=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=3600${config.baseUrl.startsWith('https:') ? '; Secure' : ''}`).redirect(303, /^\/operator\/agent\/consent\/[a-f0-9]{64}$/.test(req.body.returnTo || '') ? req.body.returnTo : '/operator');
  });
  app.get('/operator/agent/consent/:id', operator, (req,res) => {
    const flow = agentOAuth.flow(req.params.id);
    if (!flow || !config.dotsOAuth || flow.scope!==agentOAuth.scope || flow.accountId!==agentOAuth.accountId) return res.status(404).send('Authorization unavailable, changed backend or expired.');
    const client = store.state.agentOAuth.clients[flow.clientId];
    if(config.backend==='housecall') return res.send(page('Connect GoLocal to ChatGPT / Dots', `<p>Authorize <strong>${escape(client.client_name || 'registered ChatGPT client')}</strong> to read your bound Housecall Pro test company and job summaries, prepare and confirm up to three real $0 synthetic jobs, check their status and remove their schedules.</p><p>Scope: <code>${escape(agentOAuth.scope)}</code>. Company: <code>${escape(config.housecall.companyId)}</code> (GoLocal Connector Test). Fixed synthetic customer without email or phone; notifications disabled. Housecall may automatically assign the job to the bound test owner. No on-my-way/start-work calls, fulfillment, payment or general customer access. Unscheduling does not cancel the job.</p><p>Access expires in one hour; refresh access expires after ${config.oauthGrantDays || 1} day(s). The Housecall API key stays on this server.</p><p>Callback: <code>${escape(flow.redirectUri)}</code>.</p>${form(req,`/operator/agent/consent/${req.params.id}/approve`,'Approve Housecall synthetic test jobs')}${form(req,`/operator/agent/consent/${req.params.id}/deny`,'Deny access')}`));
    res.send(page('Connect GoLocal demo to ChatGPT / Dots', `<p>Authorize <strong>${escape(client.client_name || 'registered ChatGPT client')}</strong> to read simulated providers and create, check and cancel simulated bookings.</p><p>Scope: <code>${DEMO_SCOPE}</code>. No real supplier data, booking, payment or credentials are shared. Access expires in one hour; refresh access expires after one day.</p><p>Callback: <code>${escape(flow.redirectUri)}</code>.</p>${form(req,`/operator/agent/consent/${req.params.id}/approve`,'Approve simulated booking access')}${form(req,`/operator/agent/consent/${req.params.id}/deny`,'Deny access')}`));
  });
  for (const decision of ['approve','deny']) app.post(`/operator/agent/consent/:id/${decision}`,operator,csrf,wrap(async(req,res) => res.redirect(303,await agentOAuth.consent(req.params.id,decision==='approve'))));
  app.post('/operator/agent/revoke',operator,csrf,wrap(async(req,res) => { await agentOAuth.revokeAll(); if(config.hostedAccess) await store.transaction(s=>{s.hostedCredentialRevoked=true;});res.redirect(303,'/operator'); }));
  app.get('/operator', operator, (req, res) => {
    if (config.backend === 'housecall') return res.send(page('GoLocal operator', `<p>Housecall Pro bound test mode. Company: ${escape(config.housecall.companyId)}. Synthetic test writes: ${Boolean(config.housecall.writes)}.</p><p>Real vendor test jobs only; no fulfillment, dispatch or payments. Removing a schedule does not cancel the job.</p>${form(req,'/operator/agent/revoke',config.hostedAccess?'Revoke Muse and ChatGPT / Dots access':'Revoke all ChatGPT / Dots access')}<p><a href="/integration">Tool documentation</a></p>`));
    const active = store.state.jobber?.active;
    const body = `<p>Mode: <strong>${escape(config.backend)}</strong>. No live scheduling or payments.</p>
      <p>Dots OAuth: ${config.dotsOAuth ? 'enabled for demo only' : 'disabled'}.</p>${config.dotsOAuth ? form(req,'/operator/agent/revoke','Revoke all ChatGPT / Dots demo access') : ''}
      <p>Jobber: ${active ? `connected to ${escape(store.state.jobber.account.name)}` : 'not connected'}.</p>
      <p>Use a 90-day developer testing account. Set JOBBER_CLIENT_ID, JOBBER_CLIENT_SECRET and JOBBER_TEST_ACCOUNT_ID in .env, then restart.</p>
      <p>OAuth callback: <code>${escape(config.jobber.callbackUrl)}</code></p>
      ${form(req, '/operator/jobber/connect', 'Connect Jobber test account')}
      ${form(req, '/operator/jobber/forget', 'Forget locally stored Jobber credentials')}
      <p>Forgetting deletes local tokens. Revoke the app in Jobber separately.</p>
      <p><a href="/integration">Tool documentation</a></p>`;
    res.send(page('GoLocal operator', body));
  });
  app.post('/operator/jobber/connect', operator, csrf, wrap(async (req, res) => res.redirect(303, await jobber.begin())));
  app.get('/oauth/jobber/callback', operator, wrap(async (req, res) => {
    if (typeof req.query.code !== 'string' || typeof req.query.state !== 'string') throw new PilotError('INVALID_STATE', 'OAuth callback is missing the code or state.');
    await jobber.callback(req.query.code, req.query.state);
    res.redirect(303, '/operator');
  }));
  app.post('/operator/jobber/forget', operator, csrf, wrap(async (req, res) => {
    await store.transaction(s => { s.jobber = null; s.oauth = null; s.approvals = {}; });
    res.redirect(303, '/operator');
  }));
  app.get('/operator/approvals/:id', operator, (req, res) => {
    const item = store.state.approvals?.[req.params.id];
    if (!item || item.expiresAt < Date.now() || item.accountId !== config.jobber.accountId) return res.status(404).send('Approval expired or not found.');
    res.send(page('Approve one Jobber test write', `<p>Create one fake client named <strong>GoLocal Connector Test</strong> in test account <code>${escape(item.accountId)}</code>.</p><p>No email, phone, appointment or payment. Amount charged: $0.</p><p>Operation: ${escape(item.key)}.</p>${item.approved ? '<p>Approved. Return to Muse and ask it to finish this test-client operation.</p>' : form(req, `/operator/approvals/${item.id}`, 'Approve this exact test-client write')}`));
  });
  app.post('/operator/approvals/:id', operator, csrf, wrap(async (req, res) => {
    await store.transaction(s => {
      const item = s.approvals?.[req.params.id];
      if (!config.jobber.writes || !item || item.expiresAt < Date.now() || item.accountId !== config.jobber.accountId) throw new PilotError('APPROVAL_REQUIRED', 'Approval expired or test writes disabled.');
      item.approved = true;
    });
    res.redirect(303, `/operator/approvals/${req.params.id}`);
  }));
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    const safe = err instanceof PilotError;
    res.status(safe ? 400 : 500).json({ code: safe ? err.code : 'INTERNAL_ERROR', message: safe ? err.message : 'Connector error.', retryAutomatically: false });
  });
  return app;
}
