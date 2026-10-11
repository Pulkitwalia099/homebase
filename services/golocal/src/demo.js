import { randomUUID } from 'node:crypto';
import { PilotError } from './jobber.js';

export class Demo {
  constructor(store, now = () => Date.now()) { this.store = store; this.now = now; }
  providers(zip, service) {
    return { simulated: true, source: 'GoLocal fixtures; no merchant connection', providers:
      zip === '84101' && service === 'plumbing_diagnostic' ? [{
        id: 'demo-plumber', name: 'GoLocal Test Plumbing (fictional)', zip: '84101', service,
        priceCents: 0, currency: 'USD', terms: 'Simulated diagnostic visit only. No technician, repair, payment or messages.',
        cancellation: 'Simulated cancellation at no cost.'
      }] : [] };
  }
  slots() {
    const base = new Date(this.now()); base.setUTCDate(base.getUTCDate() + 1); base.setUTCHours(16, 0, 0, 0);
    return [0, 1, 2].map(n => ({ id: `demo-${base.getTime() + n * 3600000}`, startAt: new Date(base.getTime() + n * 3600000).toISOString(),
      endAt: new Date(base.getTime() + (n + 1) * 3600000).toISOString(), timezone: 'America/Denver' }));
  }
  availability(providerId) {
    if (providerId !== 'demo-plumber') throw new PilotError('NOT_FOUND', 'Unknown simulated provider.');
    return { simulated: true, slots: this.slots().filter(slot => !Object.values(this.store.state.bookings).some(b => b.slot.id === slot.id && b.state !== 'cancelled')) };
  }
  async quote(providerId, slotId) {
    const slot = this.availability(providerId).slots.find(s => s.id === slotId);
    if (!slot) throw new PilotError('SLOT_UNAVAILABLE', 'Simulated slot is unavailable. Search again.');
    const quote = { id: `demo-quote-${randomUUID()}`, providerId, slot, simulated: true, priceCents: 0, currency: 'USD',
      terms: 'Simulation only. No technician, repair, payment or messages.', cancellation: 'Free simulated cancellation.',
      expiresAt: this.now() + 600000 };
    await this.store.transaction(s => { s.quotes[quote.id] = quote; });
    return quote;
  }
  async book(quoteId, key, approved) {
    if (!approved) throw new PilotError('APPROVAL_REQUIRED', 'Confirm the exact simulated provider, appointment and zero charge before booking.');
    return this.store.transaction(s => {
      const opKey = `demo:book:${key}`;
      if (s.operations[opKey]) {
        if (s.operations[opKey].quoteId !== quoteId) throw new PilotError('IDEMPOTENCY_CONFLICT', 'Idempotency key belongs to another quote.');
        return s.bookings[s.operations[opKey].bookingId];
      }
      const quote = s.quotes[quoteId];
      if (!quote || quote.expiresAt < this.now()) throw new PilotError('QUOTE_EXPIRED', 'Simulated quote expired. Obtain a fresh quote and approval.');
      const sameQuote = Object.values(s.bookings).find(b => b.quoteId === quoteId);
      if (sameQuote) { s.operations[opKey] = { quoteId, bookingId: sameQuote.id }; return sameQuote; }
      if (!this.slots().some(slot => slot.id === quote.slot.id) || quote.slot.startAt <= new Date(this.now()).toISOString()) throw new PilotError('SLOT_UNAVAILABLE', 'Simulated slot is stale. Search again.');
      if (Object.values(s.bookings).some(b => b.slot.id === quote.slot.id && b.state !== 'cancelled')) throw new PilotError('SLOT_UNAVAILABLE', 'Another test booking took that simulated slot.');
      const booking = { id: `demo-booking-${randomUUID()}`, quoteId, providerId: quote.providerId, slot: quote.slot,
        simulated: true, state: 'simulated_confirmed', priceCents: 0, amountCharged: 0, currency: 'USD', terms: quote.terms };
      s.bookings[booking.id] = booking; s.operations[opKey] = { quoteId, bookingId: booking.id }; return booking;
    });
  }
  status(id) {
    if (!this.store.state.bookings[id]) throw new PilotError('NOT_FOUND', 'Unknown simulated booking.');
    return this.store.state.bookings[id];
  }
  async cancel(id, approved) {
    if (!approved) throw new PilotError('APPROVAL_REQUIRED', 'Confirm cancellation of this simulated booking.');
    return this.store.transaction(s => {
      if (!s.bookings[id]) throw new PilotError('NOT_FOUND', 'Unknown simulated booking.');
      s.bookings[id].state = 'cancelled'; return s.bookings[id];
    });
  }
}
