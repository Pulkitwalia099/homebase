import test from 'node:test';
import assert from 'node:assert/strict';
import { registrationDetails, registrationPath } from '../lib/registration-details.ts';
import { notificationMessage } from '../lib/registration-notifications.ts';
const input = { type: 'customer', name: 'Synthetic customer', email: 'TEST@example.com', category: 'Plumbing', location: '84101', consent: 'yes' };
test('customer registration needs no company and fixes the credit server-side', () => {
  const details = registrationDetails({ ...input, credit: { amount_cents: 999999 }, design_partner: 'yes' });
  assert.equal(details.company, ''); assert.equal(details.email, 'test@example.com');
  assert.equal(details.credit.amount_cents, 5000); assert.equal(details.credit.status, 'reserved'); assert.equal(details.credit.apply_on, 'first_real_booking');
  assert.equal(details.design_partner, true);
  const message = notificationMessage({ ...details, created_at: '2026-10-13T12:00:00Z' });
  assert.deepEqual(message.to, ['pulkitwalia099@gmail.com']); assert.ok(message.text.includes('$50 USD reserved'));
  assert.ok(message.subject.includes('Early customer'));
});
test('changing customer details or feedback preference cannot reserve a second credit', () => {
  const a = registrationDetails(input), b = registrationDetails({ ...input, name: 'New name', location: 'Dallas', design_partner: 'yes' });
  assert.equal(registrationPath(a, 'test-key'), registrationPath(b, 'test-key'));
  assert.ok(!registrationPath(a, 'test-key').includes('test@example'));
});
test('invalid registration, missing consent and malformed business inputs fail', () => {
  for (const change of [{ consent: '' }, { email: 'broken' }, { location: '' }, { category: '' }, { type: 'admin' }, { company_fax: 'spam' }]) assert.throws(() => registrationDetails({ ...input, ...change }));
  assert.throws(() => registrationDetails({ ...input, type: 'business', company: '' }));
  const business = registrationDetails({ ...input, type: 'business', company: 'Synthetic Plumbing', website: 'example.com' });
  assert.equal(business.credit, undefined);
  assert.throws(() => registrationDetails({ ...input, type: 'business', company: 'Acme', website: 'javascript://example.com' }));
});
