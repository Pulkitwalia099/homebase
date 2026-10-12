import { createHash, timingSafeEqual } from 'node:crypto';

const PILOT_ORIGIN = 'https://camryn-mechanomorphic-ellis.ngrok-free.dev';
const email = value => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const result = (body,status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});

// Only fixed pilot templates and the exact pilot origin. Never an arbitrary mail relay.
export function pilotMessage(body) {
  if (!body || Object.keys(body).some(k=>!['id','type','email','url','state','supplier'].includes(k)) || !/^[a-f0-9-]{36}$/.test(body.id||'') || !email(body.email)) throw new Error('Invalid input');
  const url=new URL(body.url);
  if(url.origin!==PILOT_ORIGIN||url.username||url.password||url.hash)throw new Error('Invalid target');
  let subject,text;
  if(body.type==='sign_in') {
    if(url.pathname!=='/account/magic-link/verify'||!url.searchParams.get('token')||[...url.searchParams.keys()].some(k=>!['token','callbackURL','errorCallbackURL','newUserCallbackURL'].includes(k)))throw new Error('Invalid link');
    for(const key of ['callbackURL','errorCallbackURL','newUserCallbackURL'])if(url.searchParams.has(key)&&new URL(url.searchParams.get(key)).origin!==PILOT_ORIGIN)throw new Error('Invalid callback');
    subject='Your GoLocal pilot sign-in link';text=`Sign in to the GoLocal test pilot using this single-use link, valid for 15 minutes:\n${url}\n\nThis pilot uses test requests only. No service is dispatched or payment collected. If you did not request this link, ignore it.`;
  } else if(['booking_pending','booking_decided'].includes(body.type)) {
    if(!/^\/assisted\/bookings\/booking_[a-f0-9-]{36}$/.test(url.pathname)||url.search||!['pending_supplier','confirmed','declined','withdrawn','expired'].includes(body.state)||typeof body.supplier!=='string'||!body.supplier.trim()||body.supplier.length>100||/[\r\n]/.test(body.supplier))throw new Error('Invalid booking');
    subject=body.type==='booking_pending'?'[GoLocal TEST] New request for your business':`[GoLocal TEST] Request ${body.state.replaceAll('_',' ')}`;
    text=`Test request with ${body.supplier}\nStatus: ${body.state.replaceAll('_',' ')}\n\nOpen your GoLocal account to review the request:\n${url}\n\nThis is a usability test. Acceptance does not dispatch a service or charge a customer. Sign in with the email receiving this message. Reply to share feedback or request help.`;
  } else throw new Error('Invalid template');
  return {from:'GoLocal pilot <notifications@getgolocal.com>',to:[body.email],reply_to:'pulkitwalia099@gmail.com',subject,text};
}

export function createPilotEmail({keyHash,expiresAt,resendKey,fetchFn=fetch,now=Date.now}) {
  return async request=>{
    if(request.method!=='POST'||new URL(request.url).search)return result({error:'Not found'},404);
    if(!/^[a-f0-9]{64}$/.test(keyHash||'')||!Number.isFinite(Date.parse(expiresAt))||Date.parse(expiresAt)<=now()||!resendKey)return result({error:'Pilot email unavailable'},503);
    const token=request.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    if(!token||!timingSafeEqual(Buffer.from(createHash('sha256').update(token).digest('hex')),Buffer.from(keyHash)))return result({error:'Unauthorized'},401);
    if(request.headers.has('origin'))return result({error:'Server requests only'},403);
    if(!request.headers.get('content-type')?.startsWith('application/json'))return result({error:'JSON required'},415);
    let body,message;
    try {
      const reader=request.body?.getReader();if(!reader)throw new Error();const chunks=[];let size=0;
      try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>5000){await reader.cancel();throw new Error();}chunks.push(Buffer.from(value));}}finally{reader.releaseLock();}
      body=JSON.parse(Buffer.concat(chunks).toString());message=pilotMessage(body);
    } catch{return result({error:'Invalid pilot email'},400);}
    try {
      const sent=await fetchFn('https://api.resend.com/emails',{method:'POST',redirect:'error',signal:AbortSignal.timeout(12000),headers:{Authorization:`Bearer ${resendKey}`,'Content-Type':'application/json','Idempotency-Key':`golocal-pilot/${body.id}`},body:JSON.stringify(message)});
      if(!sent.ok)return result({error:'Email delivery unavailable'},503);
      const data=await sent.json();if(typeof data.id!=='string')throw new Error();
      return result({sent:true,id:data.id});
    }catch{return result({error:'Email delivery outcome unknown; do not resend automatically'},502);}
  };
}
