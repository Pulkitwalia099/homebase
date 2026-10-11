import test from 'node:test';
import assert from 'node:assert/strict';
import { notificationMessage, deliverRegistration, sendRegistrationEmail } from '../lib/registration-notifications.ts';

const record = {
  type: 'business', name: 'Synthetic test', email: 'owner@example.com', company: 'Test plumbing',
  website: 'https://example.com', category: 'Plumbing', location: 'Salt Lake City', software: 'Housecall Pro',
  use_case: 'Test only', consent: true, consent_version: '2026-10-11', created_at: '2026-10-11T09:00:00.000Z', source: 'getgolocal.com',
};
const path = 'registrations/v2/business/test.json';
function fixture() {
  const data = new Map([[path, record]]);
  const calls = [];
  return { data, calls, deps: {
    read: async key => data.get(key) || null,
    markSent: async (key, id) => { data.set(key, { email_id: id }); },
    send: async (body, id) => { calls.push({ body, id }); return 'email-test-id'; },
  } };
}
test('every audience sends all details to the fixed owner with registrant reply-to', () => {
  for (const type of ['business', 'agent', 'partner']) {
    const email = notificationMessage({ ...record, type, to: 'attacker@example.com' });
    assert.deepEqual(email.to, ['pulkitwalia099@gmail.com']);
    assert.equal(email.from, 'GoLocal <notifications@getgolocal.com>');
    assert.equal(email.reply_to, record.email);
    for (const value of Object.values(record).filter(v => typeof v === 'string' && v !== 'business')) assert.ok(email.text.includes(value));
    assert.equal(email.headers.Importance, 'high');
  }
});
test('user text cannot inject email headers or HTML', () => {
  const email = notificationMessage({ ...record, company: 'Acme\r\nBcc: outsider@example.com', use_case: '<script>doSomething()</script>' });
  assert.ok(!/[\r\n]/.test(email.subject));
  assert.ok(!('html' in email));
  assert.deepEqual(email.to, ['pulkitwalia099@gmail.com']);
});
test('delivered receipt suppresses duplicate requests beyond provider idempotency window', async () => {
  const f = fixture();
  assert.equal(await deliverRegistration(path, f.deps), 'sent');
  assert.equal(await deliverRegistration(path, f.deps), 'already-sent');
  assert.equal(f.calls.length, 1);
});
test('provider failure retains the durable registration for a later retry', async () => {
  const f = fixture();
  const fail = async () => { throw new Error('Provider outage'); };
  await assert.rejects(deliverRegistration(path, { ...f.deps, send: fail }));
  assert.equal(f.data.size, 1);
  assert.equal(await deliverRegistration(path, f.deps), 'sent');
  assert.deepEqual(f.calls[0].body, record);
});
test('receipt write failure retries the same stored body and provider idempotency key', async () => {
  const f = fixture();
  await assert.rejects(deliverRegistration(path, { ...f.deps, markSent: async () => { throw new Error('Storage outage'); } }));
  await deliverRegistration(path, f.deps);
  assert.equal(f.calls.length, 2);
  assert.deepEqual(f.calls[0], f.calls[1]);
});
test('missing or unreadable registration cannot trigger email', async () => {
  const f = fixture();
  await assert.rejects(deliverRegistration('registrations/v2/business/missing.json', f.deps));
  await assert.rejects(deliverRegistration(path, { ...f.deps, read: async () => { throw new Error('Storage outage'); } }));
  assert.equal(f.calls.length, 0);
});
test('provider API receives fixed recipient and stable idempotency header', async () => {
  let captured;
  const fake = async (url, options) => { captured = { url, options }; return Response.json({ id: 'sent-id' }); };
  assert.equal(await sendRegistrationEmail(record, 'business/test', 'test-key', fake), 'sent-id');
  assert.equal(captured.url, 'https://api.resend.com/emails');
  assert.equal(captured.options.headers['Idempotency-Key'], 'golocal-registration/business/test');
  assert.deepEqual(JSON.parse(captured.options.body).to, ['pulkitwalia099@gmail.com']);
});
test('rate limits and invalid provider responses are failures, not delivery receipts', async () => {
  await assert.rejects(sendRegistrationEmail(record, 'test', 'test-key', async () => new Response('', { status: 429 })));
  await assert.rejects(sendRegistrationEmail(record, 'test', 'test-key', async () => Response.json({ error: 'invalid' })));
});
