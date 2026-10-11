import { createHash, randomBytes } from 'node:crypto';

export class PilotError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
export class Jobber {
  constructor(store, config, fetcher = fetch) {
    this.store = store; this.config = config; this.fetcher = fetcher; this.refreshing = null;
  }
  async tokenRequest(params) {
    let response;
    try {
      response = await this.fetcher('https://api.getjobber.com/api/oauth/token', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: this.config.clientId, client_secret: this.config.clientSecret, ...params }),
        signal: AbortSignal.timeout(15000)
      });
    } catch { throw new PilotError('OAUTH_UNCERTAIN', 'Token exchange outcome uncertain. Reauthorize Jobber; do not retry the old code or refresh token.'); }
    if (!response.ok) throw new PilotError('REAUTHORIZE', 'Jobber authorization failed. Reauthorize the developer test account.');
    let data;
    try { data = await response.json(); } catch { throw new PilotError('OAUTH_UNCERTAIN', 'Jobber token response unreadable. Reauthorize.'); }
    if (!data.access_token || !data.refresh_token || !Number.isFinite(data.expires_in)) throw new PilotError('OAUTH_UNCERTAIN', 'Jobber did not return usable tokens. Reauthorize.');
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: Date.now() + data.expires_in * 1000 };
  }
  async begin() {
    if (!this.config.clientId || !this.config.clientSecret || !this.config.accountId) throw new PilotError('SETUP_REQUIRED', 'Set Jobber client credentials and the expected test account ID in .env.');
    const state = randomBytes(32).toString('base64url');
    const verifier = randomBytes(48).toString('base64url');
    await this.store.transaction(s => { s.oauth = { state, verifier, expiresAt: Date.now() + 600000 }; });
    const params = new URLSearchParams({ response_type: 'code', client_id: this.config.clientId,
      redirect_uri: this.config.callbackUrl, state, code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' });
    return `https://api.getjobber.com/api/oauth/authorize?${params}`;
  }
  async callback(code, state) {
    const flow = await this.store.transaction(s => {
      if (!state || !code || s.oauth?.state !== state || s.oauth.expiresAt < Date.now()) throw new PilotError('INVALID_STATE', 'OAuth state is invalid or expired. Start a new connection.');
      const old = s.oauth; s.oauth = null; return old;
    });
    const tokens = await this.tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: this.config.callbackUrl, code_verifier: flow.verifier });
    const data = await this.raw('{ account { id name } }', {}, tokens.accessToken);
    if (data.account.id !== this.config.accountId) throw new PilotError('WRONG_ACCOUNT', 'Connected account does not match JOBBER_TEST_ACCOUNT_ID. No credentials were saved.');
    await this.store.transaction(s => { s.jobber = { ...tokens, account: data.account, active: true }; });
    return data.account;
  }
  async accessToken() {
    const saved = this.store.state.jobber;
    if (!saved?.active) throw new PilotError('NOT_CONNECTED', 'Connect the Jobber developer test account through the operator setup page.');
    if (saved.account.id !== this.config.accountId) throw new PilotError('WRONG_ACCOUNT', 'Test account binding changed. Reauthorize.');
    if (saved.expiresAt > Date.now() + 60000) return saved.accessToken;
    if (!this.refreshing) this.refreshing = this.refresh().finally(() => { this.refreshing = null; });
    return this.refreshing;
  }
  async refresh() {
    // Mark refresh in flight before contacting vendor: process restart must not replay a rotating token.
    const saved = await this.store.transaction(s => {
      if (!s.jobber?.active || s.jobber.refreshInFlight) throw new PilotError('REAUTHORIZE', 'Prior token refresh was interrupted. Reauthorize.');
      s.jobber.refreshInFlight = true; return structuredClone(s.jobber);
    });
    try {
      const tokens = await this.tokenRequest({ grant_type: 'refresh_token', refresh_token: saved.refreshToken });
      await this.store.transaction(s => {
        if (s.jobber?.refreshToken !== saved.refreshToken || !s.jobber.active) throw new PilotError('REAUTHORIZE', 'Connection changed during refresh. Reauthorize.');
        s.jobber = { ...s.jobber, ...tokens, refreshInFlight: false };
      });
      return tokens.accessToken;
    } catch (e) { await this.store.transaction(s => { if (s.jobber?.refreshToken === saved.refreshToken) s.jobber.active = false; }); throw e; }
  }
  async raw(query, variables, token) {
    let response;
    try {
      response = await this.fetcher('https://api.getjobber.com/api/graphql', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-JOBBER-GRAPHQL-VERSION': this.config.version },
        body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(15000)
      });
    } catch { throw new PilotError('VENDOR_UNCERTAIN', 'Jobber response was not received. Check the original operation before any retry.'); }
    if (response.status === 401) {
      await this.store.transaction(s => { if (s.jobber) s.jobber.active = false; });
      throw new PilotError('REAUTHORIZE', 'Jobber access expired or was revoked. Reauthorize.');
    }
    if (response.status === 429) throw new PilotError('THROTTLED', 'Jobber rate limit reached. No automatic retry.');
    if (!response.ok) throw new PilotError('VENDOR_UNCERTAIN', 'Jobber returned an unsuccessful response. Check operation status before retrying.');
    let data;
    try { data = await response.json(); } catch { throw new PilotError('VENDOR_UNCERTAIN', 'Jobber response unreadable. Check operation status.'); }
    // Do not relay vendor error text: it may contain inputs or account details.
    if (data.errors?.length || !data.data) throw new PilotError('GRAPHQL_ERROR', 'Jobber rejected the query. Check app scopes and the pinned schema in GraphiQL.');
    return data.data;
  }
  async query(query, variables = {}) { return this.raw(query, variables, await this.accessToken()); }
  async account() { return (await this.query('{ account { id name } }')).account; }
  async jobs() {
    return (await this.query('query { jobs(first: 10) { nodes { id jobNumber title } pageInfo { hasNextPage endCursor } } }')).jobs;
  }
  async createTestClient(key, approved) {
    if (!this.config.writes || !approved) throw new PilotError('WRITE_DISABLED', 'Test writes require operator enablement and explicit approval for this test client.');
    await this.accessToken();
    const operationKey = `${this.config.accountId}:test-client:${key}`;
    const prior = await this.store.transaction(s => {
      const old = s.operations[operationKey];
      if (old) return old;
      s.operations[operationKey] = { state: 'pending', createdAt: new Date().toISOString() }; return null;
    });
    if (prior) return { ...prior, replay: true, retryAllowed: false };
    try {
      // Fixed fake identity: no phone/email, so this tool cannot send customer communications.
      const data = await this.query('mutation { clientCreate(input: { firstName: "GoLocal", lastName: "Connector Test" }) { client { id firstName lastName } userErrors { message path } } }');
      if (data.clientCreate.userErrors?.length || !data.clientCreate.client?.id) throw new PilotError('WRITE_REJECTED', 'Jobber did not confirm creation. Inspect the operation in your test account.');
      const result = { state: 'test_client_created', client: data.clientCreate.client, accountId: this.config.accountId, bookingCreated: false, amountCharged: 0 };
      await this.store.transaction(s => { s.operations[operationKey] = result; });
      return result;
    } catch (e) {
      await this.store.transaction(s => { s.operations[operationKey] = { state: 'unknown', retryAllowed: false, action: 'Inspect Jobber for GoLocal Connector Test before retrying. Use the same idempotency key.' }; });
      throw e;
    }
  }
}
