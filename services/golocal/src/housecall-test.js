import { randomUUID } from 'node:crypto';
import { PilotError } from './jobber.js';

// Test-account-only writes. Inputs cannot choose customers, addresses, prices or employees.
export class HousecallTest {
  constructor(adapter, store, config) { this.adapter=adapter; this.store=store; this.config=config; this.queue=Promise.resolve(); }
  serial(fn) { const run=this.queue.then(fn); this.queue=run.catch(()=>{}); return run; }
  async guard() {
    if (!this.config.writes || !this.config.companyId || !this.store) throw new PilotError('WRITES_DISABLED','Housecall test writes are disabled.');
    const company=await this.adapter.company();
    if (company.name !== 'GoLocal Connector Test' || company.timeZone !== 'America/New_York') throw new PilotError('WRONG_ACCOUNT','Writes require the named GoLocal Connector Test company in America/New_York.');
  }
  async request(method,path,body) {
    if (!((method==='POST' && ['/customers','/jobs'].includes(path)) || (method==='GET' && /^\/(customers|jobs)\/[a-zA-Z0-9_-]+$/.test(path)) || (method==='DELETE' && /^\/jobs\/[a-zA-Z0-9_-]+\/schedule$/.test(path)))) throw new PilotError('INVALID_ENDPOINT','Test endpoint not enabled.');
    let response;
    try { response=await this.adapter.fetcher(`https://api.housecallpro.com${path}`,{method,headers:{Authorization:`Token ${this.config.apiKey}`,Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(15000)}); }
    catch { throw new PilotError('UNKNOWN_OUTCOME','Vendor request outcome is unknown. Do not repeat the write; inspect the test account.'); }
    if (!response.ok) throw new PilotError(method==='GET'?'VENDOR_UNAVAILABLE':'WRITE_REJECTED',`Housecall returned HTTP ${response.status}. No automatic retry.`);
    try { return await response.json(); } catch { throw new PilotError('UNKNOWN_OUTCOME','Vendor response could not be verified. Do not repeat the write.'); }
  }
  async once(key,fn) {
    const prior=await this.store.transaction(s=>{
      s.housecallOperations ??= {};
      const prior=s.housecallOperations[key];
      if (prior) return prior;
      s.housecallOperations[key]={state:'pending',companyId:this.config.companyId}; return null;
    });
    if(prior) {
      if(prior.companyId!==this.config.companyId || prior.state!=='done') throw new PilotError('UNKNOWN_OUTCOME','Previous write is pending or uncertain. Operator reconciliation required.');
      return prior.result;
    }
    const result=await fn();
    await this.store.transaction(s=>{s.housecallOperations[key]={state:'done',companyId:this.config.companyId,result};});
    return result;
  }
  validId(value) { if(typeof value!=='string' || !/^[a-zA-Z0-9_-]{1,180}$/.test(value)) throw new PilotError('INVALID_RESPONSE','Invalid vendor record ID.'); return value; }
  checkCustomer(c) {
    if(c.company_id!==this.config.companyId || c.first_name!=='GoLocal' || c.last_name!=='API Test - No Service' || c.notifications_enabled!==false || [c.email,c.mobile_number,c.home_number,c.work_number].some(Boolean)) throw new PilotError('UNSAFE_CUSTOMER','Test customer identity or notification settings changed.');
  }
  async fixture() {
    return this.once(`fixture:${this.config.companyId}`,async()=>{
      const c=await this.request('POST','/customers',{first_name:'GoLocal',last_name:'API Test - No Service',notifications_enabled:false,notes:'Synthetic connector test only. No service or communication.',addresses:[{street:'GoLocal API TEST - NO SERVICE LOCATION',city:'Boston',state:'MA',zip:'02108',country:'US'}]});
      this.checkCustomer(c);
      if(!Array.isArray(c.addresses)||c.addresses.length!==1) throw new PilotError('INVALID_RESPONSE','Expected one synthetic address.');
      return {customerId:this.validId(c.id),addressId:this.validId(c.addresses[0].id)};
    });
  }
  async prepare() {
    await this.guard();
    const existingFixture=this.store.state.housecallOperations?.[`fixture:${this.config.companyId}`];
    let customerContactVerified=false;
    if(existingFixture?.state==='done' && existingFixture.companyId===this.config.companyId) {
      this.checkCustomer(await this.request('GET',`/customers/${this.validId(existingFixture.result.customerId)}`));
      customerContactVerified=true;
    }
    const start=new Date(); start.setUTCDate(start.getUTCDate()+1); start.setUTCHours(16,0,0,0);
    const quote={id:randomUUID(),companyId:this.config.companyId,start:start.toISOString(),end:new Date(+start+3600000).toISOString(),expiresAt:Date.now()+600000};
    await this.store.transaction(s=>{s.housecallQuotes ??= {};s.housecallQuotes[quote.id]=quote;});
    return {...quote,timeZone:'America/New_York',amount:0,currency:'USD',customer:'GoLocal API Test - No Service',service:'Synthetic plumbing test - NO SERVICE',availabilityChecked:false,customerContactVerified,customerHasEmail:customerContactVerified?false:null,customerHasPhone:customerContactVerified?false:null,customerNotifications:false,customerContactPolicy:'No email or phone allowed; verified again before job creation.',workStartSupported:false,dispatchWorkflowSupported:false,paymentsSupported:false,terms:'Creates a real $0 test job in your trial only. Housecall may assign the bound test owner automatically. No dispatch workflow, payment or customer notifications. Schedule removal does not cancel the job.'};
  }
  checkJob(j,fixture) {
    if(j.company_id!==this.config.companyId || j.customer?.id!==fixture.customerId || j.customer?.notifications_enabled!==false || [j.customer?.email,j.customer?.mobile_number,j.customer?.home_number,j.customer?.work_number].some(Boolean) || j.address?.id!==fixture.addressId || j.total_amount!==0 || j.outstanding_balance!==0 || !Array.isArray(j.assigned_employees) || j.assigned_employees.some(e=>e.id!==this.config.ownerId||e.company_id!==this.config.companyId) || j.assigned_employees.length>1 || Object.values(j.work_timestamps||{}).some(Boolean)) throw new PilotError('WRONG_RECORD','Vendor job no longer matches the safe synthetic test.');
  }
  project(j) { return {jobId:j.id,invoiceNumber:j.invoice_number,workStatus:j.work_status,scheduledStart:j.schedule?.scheduled_start||null,scheduledEnd:j.schedule?.scheduled_end||null,scheduledStartLocal:j.schedule?.scheduled_start_local||null,timeZone:j.schedule?.time_zone||'America/New_York',totalAmount:j.total_amount,amountCharged:0,realVendorRecord:true,syntheticCustomer:true,availabilityChecked:false,customerNotifications:false}; }
  confirm(quoteId,key,approved) { return this.serial(async()=>{
    await this.guard();
    if(!approved) throw new PilotError('APPROVAL_REQUIRED','Approve the exact $0 synthetic test quote.');
    const operation=`job:${this.config.companyId}:${key}`;
    const prior=this.store.state.housecallOperations?.[operation];
    if(prior) {
      if(prior.state!=='done') throw new PilotError('UNKNOWN_OUTCOME','Prior job outcome is uncertain. Do not retry.');
      if(prior.result?.quoteId!==quoteId) throw new PilotError('IDEMPOTENCY_CONFLICT','Key already belongs to another quote.');
      return {...await this.status(prior.result.jobId),idempotentReplay:true};
    }
    const q=this.store.state.housecallQuotes?.[quoteId];
    if(!q || q.companyId!==this.config.companyId || q.expiresAt<Date.now()) throw new PilotError('QUOTE_EXPIRED','Test quote missing or expired.');
    await this.store.transaction(s=>{const quote=s.housecallQuotes[quoteId];if(quote.key&&quote.key!==key) throw new PilotError('IDEMPOTENCY_CONFLICT','This quote already belongs to another operation key.');quote.key=key;});
    if(Object.keys(this.store.state.housecallOperations||{}).filter(k=>k.startsWith(`job:${this.config.companyId}:`)).length>=3) throw new PilotError('TEST_LIMIT','Three-job pilot limit reached, including uncertain writes.');
    const fixture=await this.fixture();
    this.checkCustomer(await this.request('GET',`/customers/${fixture.customerId}`));
    const result=await this.once(operation,async()=>{
      const j=await this.request('POST','/jobs',{customer_id:fixture.customerId,address_id:fixture.addressId,schedule:{scheduled_start:q.start,scheduled_end:q.end,arrival_window:0,anytime:false},assigned_employee_ids:[],line_items:[{name:'GoLocal API TEST - NO SERVICE',description:'Synthetic plumbing booking test only. Do not fulfill.',unit_price:0,quantity:1,unit_cost:0}],notes:`Synthetic connector test only. Quote ${q.id}. No service, dispatch, payment or messages.`});
      this.validId(j.id);this.checkJob(j,fixture);
      if(j.work_status!=='scheduled'||Date.parse(j.schedule?.scheduled_start)!==Date.parse(q.start)||Date.parse(j.schedule?.scheduled_end)!==Date.parse(q.end)) throw new PilotError('UNKNOWN_OUTCOME','Created job schedule differs from approved quote. Inspect the test account.');
      return {jobId:j.id,quoteId:q.id,fixture};
    });
    return {...await this.status(result.jobId),idempotentReplay:false};
  }); }
  record(id) {
    const record=Object.values(this.store.state.housecallOperations||{}).find(o=>o.state==='done'&&o.companyId===this.config.companyId&&o.result?.jobId===id);
    if(!record) throw new PilotError('NOT_FOUND','Only connector-created test jobs are accessible.');return record.result;
  }
  async status(id) {
    await this.guard(); const record=this.record(id);
    const j=await this.request('GET',`/jobs/${this.validId(id)}`);this.checkJob(j,record.fixture);return this.project(j);
  }
  unschedule(id,approved) { return this.serial(async()=>{
    await this.guard();if(!approved) throw new PilotError('APPROVAL_REQUIRED','Approve removal of the test schedule.');
    const record=this.record(id);this.checkCustomer(await this.request('GET',`/customers/${record.fixture.customerId}`));
    const j=await this.request('GET',`/jobs/${this.validId(id)}`);this.checkJob(j,record.fixture);
    if(j.work_status==='needs scheduling'&&!j.schedule?.scheduled_start) return {...this.project(j),unscheduled:true,jobCancelled:false};
    if(j.work_status!=='scheduled') throw new PilotError('UNSAFE_STATE','Only a scheduled synthetic job can be unscheduled.');
    await this.once(`unschedule:${this.config.companyId}:${id}`,()=>this.request('DELETE',`/jobs/${id}/schedule`));
    const result=await this.status(id);
    if(result.scheduledStart || result.workStatus!=='needs scheduling') throw new PilotError('UNKNOWN_OUTCOME','Schedule removal not verified. Inspect the account.');
    return {...result,unscheduled:true,jobCancelled:false};
  }); }
}
