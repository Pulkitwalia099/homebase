import { PilotError } from './jobber.js';

// Private, read-only adapter. No agent-supplied URLs, headers or vendor queries.
export class Housecall {
  constructor(config, fetcher = fetch) { this.config = config; this.fetcher = fetcher; }
  async read(path) {
    if (!this.config.apiKey || !this.config.companyId) throw new PilotError('SETUP_REQUIRED', 'Set a read-only Housecall Pro API key and the expected test company ID in the private .env file.');
    if (!['/company', '/jobs?page=1&page_size=10'].includes(path)) throw new PilotError('INVALID_ENDPOINT', 'Endpoint is not enabled for this test.');
    let response;
    try {
      response = await this.fetcher(`https://api.housecallpro.com${path}`, {
        method: 'GET', headers: { Authorization: `Token ${this.config.apiKey}`, Accept: 'application/json' },
        redirect: 'error', signal: AbortSignal.timeout(15000)
      });
    } catch { throw new PilotError('VENDOR_UNAVAILABLE', 'Housecall Pro read could not be completed. No automatic retry.'); }
    if (response.status === 401 || response.status === 403) throw new PilotError('ACCESS_DENIED', 'Housecall Pro rejected access. Check key permissions and trial API entitlement.');
    if (response.status === 429) throw new PilotError('THROTTLED', 'Housecall Pro rate limit reached. No automatic retry.');
    if (!response.ok) throw new PilotError('VENDOR_UNAVAILABLE', 'Housecall Pro returned an unsuccessful response.');
    try { return await response.json(); } catch { throw new PilotError('INVALID_RESPONSE', 'Housecall Pro response was unreadable.'); }
  }
  async company() {
    const company = await this.read('/company');
    if (company?.id !== this.config.companyId) throw new PilotError('WRONG_ACCOUNT', 'Housecall Pro company does not match HOUSECALL_TEST_COMPANY_ID.');
    return { id: company.id, name: company.name, timeZone: company.time_zone };
  }
  async jobs() {
    // Verify identity before each jobs read, including after the operator changes keys.
    await this.company();
    const data = await this.read('/jobs?page=1&page_size=10');
    if (!Array.isArray(data?.jobs) || data.jobs.length > 10) throw new PilotError('INVALID_RESPONSE', 'Housecall Pro did not return the requested bounded jobs page.');
    if (data.jobs.some(job => job.company_id !== this.config.companyId)) throw new PilotError('WRONG_ACCOUNT', 'Jobs include another company. Multi-location reads are disabled for this test.');
    return { jobs: data.jobs.map(job => ({ id: job.id, invoiceNumber: job.invoice_number, workStatus: job.work_status })),
      page: data.page, totalPages: data.total_pages, availabilityInferred: false };
  }
}
