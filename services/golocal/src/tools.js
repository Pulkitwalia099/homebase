import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { randomUUID } from 'node:crypto';
import { PilotError } from './jobber.js';

const id = z.string().min(1).max(180);
const key = z.string().regex(/^[a-zA-Z0-9_-]{8,80}$/);
export function makeTools({ demo, jobber, housecall, housecallTest, store, config }) {
  const tools = [];
  const add = (name, description, schema, fn, readOnly = true, destructive = false) => tools.push({ name, description, schema, fn,
    annotations: { readOnlyHint: readOnly, destructiveHint: destructive, idempotentHint: readOnly || ['confirm_booking', 'cancel_booking', 'commit_jobber_test_client', 'confirm_housecall_test_booking', 'unschedule_housecall_test_booking'].includes(name), openWorldHint: false } });
  add('connector_status', 'Get connector backend, test restrictions and enabled capabilities. Does not validate a live booking.', {}, async () => ({
    backend: config.backend, pilot: true, singleOperator: true, liveBookingsSupported: false, paymentsSupported: false,
    dotsOAuthEnabled: Boolean(config.dotsOAuth), dotsOAuthScope: config.dotsOAuth ? (config.backend==='housecall'?'golocal:housecall-test':'golocal:demo') : null,
    jobberConnected: Boolean(store.state.jobber?.active), jobberTestWritesEnabled: config.jobber.writes,
    housecallConfigured: config.backend === 'housecall' && Boolean(config.housecall?.apiKey && config.housecall?.companyId), housecallTestWritesEnabled: Boolean(config.housecall?.writes),
    modeNotice: config.backend === 'demo' ? 'All provider data and bookings are simulated.' : config.backend === 'housecall' ? (config.housecall?.writes?'Housecall bound synthetic test jobs enabled. No real service, crew availability, payments or job cancellation API; schedule removal only.':'Housecall Pro test company and bounded job reads only. No vendor writes or live availability.') : 'Jobber account reads and operator-approved test-client writes only. Live scheduling is not implemented.'
  }));
  if (config.backend === 'demo') {
    add('search_providers', 'Search fictional test plumbing providers in Salt Lake City ZIP 84101. No real merchant data.', {
      zip: z.string().regex(/^\d{5}$/), service: z.enum(['plumbing_diagnostic'])
    }, ({ zip, service }) => demo.providers(zip, service));
    add('get_availability', 'Get simulated appointment slots for a fictional provider; these are not real crew availability.', { provider_id: id }, ({ provider_id }) => demo.availability(provider_id));
    add('prepare_booking', 'Create a ten-minute simulated quote with exact appointment, price and terms. Changes local test state.', {
      provider_id: id, slot_id: id
    }, ({ provider_id, slot_id }) => demo.quote(provider_id, slot_id), false);
    add('confirm_booking', 'Confirm the approved simulated quote. No real service or charge. Reuse idempotency_key for retries.', {
      quote_id: id, idempotency_key: key, user_approved: z.boolean()
    }, ({ quote_id, idempotency_key, user_approved }) => demo.book(quote_id, idempotency_key, user_approved), false, true);
    add('get_booking_status', 'Get the authoritative local state of a simulated booking.', { booking_id: id }, ({ booking_id }) => demo.status(booking_id));
    add('cancel_booking', 'Cancel the specified simulated booking after approval. No real provider cancellation or refund.', {
      booking_id: id, user_approved: z.boolean()
    }, ({ booking_id, user_approved }) => demo.cancel(booking_id, user_approved), false, true);
  } else if (config.backend === 'housecall') {
    add('housecall_company', 'Read ID, name and time zone of the operator-bound Housecall Pro test company. No contact details.', {}, () => housecall.company());
    add('housecall_list_jobs', 'Read the first ten job IDs, invoice numbers and work states from the bound test company. Omits customer details and does not infer crew availability.', {}, () => housecall.jobs());
    if(config.housecall.writes) {
      add('prepare_housecall_test_booking','Prepare an exact $0 synthetic job quote in the named GoLocal test company. Fixed fake customer, no contact details or crew availability promise.',{},()=>housecallTest.prepare(),false);
      add('confirm_housecall_test_booking','After exact quote approval, create one real vendor test job. No service, dispatch, notification or payment. Reuse the same idempotency key.',{quote_id:id,idempotency_key:key,user_approved:z.boolean()},a=>housecallTest.confirm(a.quote_id,a.idempotency_key,a.user_approved),false,true);
      add('housecall_test_booking_status','Read authoritative vendor state of a connector-created synthetic test job only.',{job_id:id},a=>housecallTest.status(a.job_id));
      add('unschedule_housecall_test_booking','Remove the schedule from the approved synthetic test job. This does NOT cancel or delete the job; it remains needs scheduling.',{job_id:id,user_approved:z.boolean()},a=>housecallTest.unschedule(a.job_id,a.user_approved),false,true);
    }
  } else {
    add('jobber_account', 'Read the name and ID of the operator-bound Jobber developer test account.', {}, () => jobber.account());
    add('jobber_list_jobs', 'Read the first ten job IDs, numbers and titles in the bound developer test account. Does not infer available slots.', {}, () => jobber.jobs());
    if (config.jobber.writes) {
      add('prepare_jobber_test_client', 'Prepare a real write to the bound Jobber developer test account: create GoLocal Connector Test, with no email or phone. Requires separate operator approval in the browser.', {
        idempotency_key: key
      }, async ({ idempotency_key }) => {
        await jobber.account();
        const approval = await store.transaction(s => {
          s.approvals ??= {};
          const prior = Object.values(s.approvals).find(a => a.key === idempotency_key && a.accountId === config.jobber.accountId && a.expiresAt > Date.now());
          if (prior) return prior;
          const item = { id: randomUUID(), key: idempotency_key, accountId: config.jobber.accountId, approved: false, expiresAt: Date.now() + 600000 };
          s.approvals[item.id] = item; return item;
        });
        return { approvalId: approval.id, approvalUrl: `${config.baseUrl}/operator/approvals/${approval.id}`, state: 'awaiting_operator_approval',
          action: 'Create one fake Jobber client named GoLocal Connector Test. No booking, email, phone or payment.', amountCharged: 0 };
      }, false);
      add('commit_jobber_test_client', 'Execute the exact operator-approved fake-client write once. Pending or unknown outcomes are never automatically retried. This is not a booking.', {
        approval_id: z.string().uuid()
      }, async ({ approval_id }) => {
        const approval = store.state.approvals?.[approval_id];
        if (!approval?.approved || approval.expiresAt < Date.now() || approval.accountId !== config.jobber.accountId) throw new PilotError('APPROVAL_REQUIRED', 'Operator approval missing or expired. Open the approval URL.');
        return jobber.createTestClient(approval.key, true);
      }, false, true);
    }
  }
  return tools;
}

export function makeServer(context) {
  const server = new McpServer({ name: 'golocal-pilot', version: '0.1.0' });
  for (const tool of makeTools(context)) server.registerTool(tool.name, {
    title: tool.name.replaceAll('_', ' '), description: tool.description, inputSchema: tool.schema, annotations: tool.annotations
  }, async args => {
    try {
      const result = await tool.fn(args);
      return { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result };
    } catch (e) {
      const result = { code: e instanceof PilotError ? e.code : 'INTERNAL_ERROR', message: e instanceof PilotError ? e.message : 'Connector error. Ask the operator to inspect the server.', retryAutomatically: false };
      return { isError: true, content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
  });
  return server;
}
