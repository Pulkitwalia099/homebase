import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createPilotEmail,pilotMessage } from '../lib/pilot-email.mjs';
const token='e'.repeat(64),origin='https://camryn-mechanomorphic-ellis.ngrok-free.dev',id='12345678-1234-1234-1234-123456789abc';
const body={id,type:'sign_in',email:'tester@example.test',url:origin+'/account/magic-link/verify?token=synthetic&callbackURL='+encodeURIComponent(origin+'/assisted')};
const req=(b=body,headers={})=>new Request('https://getgolocal.com/api/pilot-email',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',...headers},body:JSON.stringify(b)});
test('pilot email authenticates before sending; validates expiry and rejects browser origins',async()=>{
 let calls=0;const run=createPilotEmail({keyHash:createHash('sha256').update(token).digest('hex'),expiresAt:new Date(Date.now()+86400000).toISOString(),resendKey:'private',fetchFn:async()=>{calls++;return Response.json({id:'sent'});}});
 assert.equal((await run(req(body,{Authorization:'Bearer wrong'}))).status,401);
 assert.equal((await run(req(body,{Origin:origin}))).status,403);
 assert.equal((await run(req())).status,200);assert.equal(calls,1);
 const expired=createPilotEmail({keyHash:'a'.repeat(64),expiresAt:new Date(0).toISOString(),resendKey:'private'});assert.equal((await expired(req())).status,503);
});
test('pilot email permits only fixed templates and exact account/booking links',()=>{
 assert.equal(pilotMessage(body).reply_to,'pulkitwalia099@gmail.com');
 for(const change of [{url:'https://evil.example/account/magic-link/verify?token=a'},{url:origin+'/account/magic-link/verify?token=a&callbackURL=https://evil.example'},{html:'unsolicited'},{type:'arbitrary'},{email:'bad\r\n@example.com'}])assert.throws(()=>pilotMessage({...body,...change}));
 assert.match(pilotMessage({...body,type:'booking_decided',url:origin+'/assisted/bookings/booking_'+id,state:'declined',supplier:'Test Plumbing'}).subject,/TEST/);
});
test('provider failures omit secrets and are never automatically retried',async()=>{
 let calls=0;const run=createPilotEmail({keyHash:createHash('sha256').update(token).digest('hex'),expiresAt:new Date(Date.now()+86400000).toISOString(),resendKey:'private',fetchFn:async()=>{calls++;throw new Error('private');}});
 const response=await run(req());assert.equal(response.status,502);assert(!(await response.text()).includes('private'));assert.equal(calls,1);
});
