import { createHmac } from 'node:crypto';
const text = (value: unknown, max: number) => typeof value === 'string' && value.trim().length <= max ? value.trim() : '';
export function registrationDetails(body: Record<string, unknown>) {
  const type = text(body.type, 20), name = text(body.name, 100), email = text(body.email, 254).toLowerCase(), company = text(body.company, 150);
  const category = text(body.category, 100), location = text(body.location, 200), software = text(body.software, 200), useCase = text(body.use_case, 2000), website = text(body.website, 300);
  const customer = type === 'customer';
  if (body.company_fax || !['customer', 'business', 'agent', 'partner'].includes(type) || !name || (!customer && !company) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || body.consent !== 'yes' || (['customer', 'business'].includes(type) && (!category || !location)) || (['agent', 'partner'].includes(type) && !useCase)) throw new Error('Please complete the required fields and consent checkbox.');
  if (website) { try { const url = new URL(website.includes('://') ? website : `https://${website}`); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); } catch { throw new Error('Please enter a valid company website.'); } }
  return { type, name, email, company: customer ? '' : company, website: customer ? '' : website, category, location, software, use_case: useCase, consent: true, consent_version: '2026-10-13', source: 'getgolocal.com', ...(customer ? { design_partner: body.design_partner === 'yes', credit: { amount_cents: 5000, currency: 'USD', status: 'reserved', apply_on: 'first_real_booking', redemption: '$50 off your first real GoLocal home-service booking once services are available in your area. No cash value. One early-customer credit per person. Demo bookings excluded.' } } : {}) };
}
export function registrationPath(details: ReturnType<typeof registrationDetails>, secret: string) {
  // Customers reserve one credit per email, even if they change city or feedback preference.
  const identity = details.type === 'customer' ? `customer:${details.email}` : JSON.stringify(details);
  const key = createHmac('sha256', secret).update(identity).digest('hex');
  return `registrations/v2/${details.type}/${key}.json`;
}
