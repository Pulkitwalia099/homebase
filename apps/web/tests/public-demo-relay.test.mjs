import test from 'node:test';
import assert from 'node:assert/strict';
import { relayDemo } from '../lib/public-demo-relay.ts';
const req = body => new Request('https://getgolocal.com/demo/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer private-account-key', Cookie: 'private-session' }, body: JSON.stringify(body) });
test('MCP initialized notification preserves empty 202 acknowledgement', async () => {
  const r = await relayDemo(req({ jsonrpc: '2.0', method: 'notifications/initialized' }), '/demo/mcp', async () => new Response(null, { status: 202 }));
  assert.equal(r.status, 202); assert.equal(await r.text(), '');
});
test('public relay reaches only the demo endpoint without private headers and preserves tool failures', async () => {
  let call;
  const r = await relayDemo(req({ zip: '84101' }), '/demo/api/tools/search_providers', async (url, options) => { call = { url, options }; return Response.json({ code: 'INVALID_INPUT' }, { status: 400 }); });
  assert.equal(call.url, 'https://camryn-mechanomorphic-ellis.ngrok-free.dev/demo/api/tools/search_providers');
  assert.equal(call.options.headers.Authorization, undefined); assert.equal(call.options.headers.Cookie, undefined);
  assert.equal(r.status, 400); assert.equal((await r.json()).code, 'INVALID_INPUT');
});
test('relay outage fails once with no credential disclosure or false confirmation', async () => {
  let calls = 0;
  const r = await relayDemo(req({}), '/demo/mcp', async () => { calls++; throw new Error('upstream secret'); });
  assert.equal(r.status, 503); assert.equal(calls, 1); assert.ok(!(await r.text()).includes('secret'));
});
