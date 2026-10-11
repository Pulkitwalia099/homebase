import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createGoLocalRelay } from '../lib/golocal-relay.mjs';

const token = 'a'.repeat(64);
const keyHash = createHash('sha256').update(token).digest('hex');
const time = Date.parse('2026-10-11T05:00:00Z');
const expiresAt = '2026-10-12T04:00:00Z';
const req = (path, options = {}) => new Request('https://getgolocal.com/api/connector/' + path, { headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json', ...(options.headers || {}) }, ...options });
const make = (changes = {}) => createGoLocalRelay({ keyHash, expiresAt, now: () => time, fetchFn: async () => Response.json({ ok: true }), ...changes });

test('disabled, expired, long-lived and wrong credentials never reach upstream', async () => {
  for (const options of [{ keyHash: undefined }, { expiresAt: '2026-10-11T04:00:00Z' }, { expiresAt: '2026-10-13T04:00:00Z' }, { keyHash: 'b'.repeat(64) }]) {
    let calls = 0;
    const relay = make({ ...options, fetchFn: async () => { calls++; return Response.json({}); } });
    assert.ok((await relay(req('tools'), ['tools'])).status >= 400);
    assert.equal(calls, 0);
  }
  assert.equal((await make()(req('tools', { headers: {} }), ['tools'])).status, 401);
});

test('allowlist rejects operator, OAuth, arbitrary tools, query and browser origins', async () => {
  let calls = 0;
  const relay = make({ fetchFn: async () => { calls++; return Response.json({}); } });
  for (const path of ['operator', 'oauth', 'tools/not_a_tool', 'tools/housecall_company/extra']) assert.equal((await relay(req(path, { method: 'POST', body: '{}' }), path.split('/'))).status, 404);
  assert.equal((await relay(req('tools?url=https://evil.example'), ['tools'])).status, 400);
  assert.equal((await relay(req('tools', { headers: { authorization: 'Bearer ' + token, origin: 'https://evil.example' } }), ['tools'])).status, 403);
  assert.equal(calls, 0);
});

test('one approved request forwards only the bearer and JSON to a fixed HTTPS target', async () => {
  let calls = 0;
  const relay = make({ fetchFn: async (url, options) => {
    calls++;
    assert.equal(url, 'https://camryn-mechanomorphic-ellis.ngrok-free.dev/api/tools/confirm_housecall_test_booking');
    assert.equal(options.redirect, 'error');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.headers.Authorization, 'Bearer ' + token);
    assert.equal(options.headers.cookie, undefined);
    assert.equal(options.headers['x-secret'], undefined);
    assert.equal(options.body, '{"quote_id":"q","idempotency_key":"test","user_approved":true}');
    return Response.json({ job_id: 'test-job', replayed: false });
  } });
  const response = await relay(req('tools/confirm_housecall_test_booking', { method: 'POST', body: '{"quote_id":"q","idempotency_key":"test","user_approved":true}', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json', cookie: 'private', 'x-secret': 'private' } }), ['tools', 'confirm_housecall_test_booking']);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(calls, 1);
});

test('malformed, oversized and non-JSON writes are rejected before forwarding', async () => {
  let calls = 0;
  const relay = make({ fetchFn: async () => { calls++; return Response.json({}); } });
  for (const body of ['bad json', '[]', 'null', JSON.stringify({ text: 'a'.repeat(32768) })]) assert.equal((await relay(req('tools/prepare_housecall_test_booking', { method: 'POST', body }), ['tools', 'prepare_housecall_test_booking'])).status, 400);
  assert.equal(calls, 0);
});

test('uncertain write returns a safe error after one attempt without exposing exceptions', async () => {
  let calls = 0;
  const relay = make({ fetchFn: async () => { calls++; throw Error('secret exception'); } });
  const response = await relay(req('tools/confirm_housecall_test_booking', { method: 'POST', body: '{}' }), ['tools', 'confirm_housecall_test_booking']);
  assert.deepEqual(await response.json(), { code: 'UPSTREAM_OUTCOME_UNKNOWN', retryAutomatically: false });
  assert.equal(calls, 1);
});

test('public documentation uses GoLocal relay URLs and excludes unrelated tools and credentials', async () => {
  const relay = make({ keyHash: undefined, fetchFn: async (url, options) => {
    assert.equal(options.headers.Authorization, undefined);
    return Response.json({ backend: 'housecall', tools: [{ name: 'connector_status', description: 'status', inputSchema: {} }, { name: 'operator_secret', description: 'excluded' }], secret: 'excluded' });
  } });
  const data = await (await relay(req('integration', { headers: {} }), ['integration'])).json();
  assert.equal(data.name, 'GoLocal');
  assert.equal(data.api.listTools, 'https://getgolocal.com/api/connector/tools');
  assert.deepEqual(data.tools.map(t => t.name), ['connector_status']);
  assert.equal(data.secret, undefined);
});

test('explicit hosted mode uses only the fixed hosted origin and still requires the same verifier',async()=>{
 let calls=0;
 const relay=make({hosted:true,expiresAt:undefined,fetchFn:async(url)=>{calls++;assert.equal(url,'https://api.getgolocal.com/api/tools');return Response.json({tools:[]});}});
 assert.equal((await relay(req('tools'),['tools'])).status,200);assert.equal(calls,1);
 const denied=make({hosted:true,keyHash:'b'.repeat(64),fetchFn:async()=>{throw new Error('must not forward');}});
 assert.equal((await denied(req('tools'),['tools'])).status,401);
 assert.equal((await make({expiresAt:undefined})(req('tools'),['tools'])).status,503);
});
