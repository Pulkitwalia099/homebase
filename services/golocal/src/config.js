import { createHash } from 'node:crypto';

export function getConfig(env = process.env) {
  const baseUrl = (env.PUBLIC_BASE_URL || 'http://localhost:8787').replace(/\/$/, '');
  const parsed = new URL(baseUrl);
  if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') throw new Error('PUBLIC_BASE_URL must be an origin URL.');
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname))) throw new Error('Public endpoints require HTTPS.');
  for (const name of ['MCP_BEARER_TOKEN', 'ADMIN_TOKEN']) {
    if ((env[name] || '').length < 32) throw new Error(`${name} must be at least 32 characters. Run npm run setup.`);
  }
  if (env.MCP_BEARER_TOKEN === env.ADMIN_TOKEN) throw new Error('Agent and operator tokens must be different.');
  const hosted = env.GOLOCAL_HOSTED === 'true';
  if (hosted && (parsed.protocol !== 'https:' || env.DATA_DIR !== '/var/data/golocal' || env.HOST !== '0.0.0.0')) throw new Error('Hosted mode requires HTTPS, the persistent data mount and public binding.');
  const backend = env.BACKEND || 'demo';
  if (!['demo', 'jobber', 'housecall'].includes(backend)) throw new Error('BACKEND must be demo, jobber or housecall.');
  const writes = env.ENABLE_JOBBER_TEST_WRITES === 'true';
  if (writes && (backend !== 'jobber' || !env.JOBBER_TEST_ACCOUNT_ID)) throw new Error('Test writes require Jobber mode and an explicit test account ID.');
  let museAccess=null;
  let hostedAccess=null;
  if (env.GOLOCAL_HOSTED_KEY_SHA256) {
    if (!hosted || backend !== 'housecall' || !/^[a-f0-9]{64}$/.test(env.GOLOCAL_HOSTED_KEY_SHA256) || [env.MCP_BEARER_TOKEN,env.ADMIN_TOKEN,env.HOUSECALL_API_KEY].filter(Boolean).some(value=>createHash('sha256').update(value).digest('hex')===env.GOLOCAL_HOSTED_KEY_SHA256) || !env.GOLOCAL_HOSTED_COMPANY_ID || env.GOLOCAL_HOSTED_COMPANY_ID !== env.HOUSECALL_TEST_COMPANY_ID || env.GOLOCAL_HOSTED_KEY_ENABLED !== 'true') throw new Error('Hosted agent access requires explicit enablement, an independent credential verifier and the bound Housecall company.');
    hostedAccess={keyHash:env.GOLOCAL_HOSTED_KEY_SHA256,companyId:env.GOLOCAL_HOSTED_COMPANY_ID,baseUrl};
  }
  if(env.MUSE_TEST_BEARER_TOKEN) {
    const expiresAt=Date.parse(env.MUSE_TEST_TOKEN_EXPIRES_AT || '');
    const museUrl=new URL(env.MUSE_TEST_PUBLIC_BASE_URL || 'http://invalid');
    if(env.MUSE_TEST_BEARER_TOKEN.length<32 || [env.MCP_BEARER_TOKEN,env.ADMIN_TOKEN,env.HOUSECALL_API_KEY].includes(env.MUSE_TEST_BEARER_TOKEN) || !env.MUSE_TEST_COMPANY_ID || !Number.isFinite(expiresAt) || expiresAt>Date.now()+86400000 || museUrl.protocol!=='https:' || museUrl.origin!==env.MUSE_TEST_PUBLIC_BASE_URL) throw new Error('Muse test access requires an independent key, exact company/HTTPS origin and expiry within one day.');
    museAccess={token:env.MUSE_TEST_BEARER_TOKEN,companyId:env.MUSE_TEST_COMPANY_ID,baseUrl:museUrl.origin,expiresAt};
  }
  return { port: Number(env.PORT || 8787), host: env.HOST || '127.0.0.1', baseUrl, backend, dotsOAuth: env.ENABLE_DOTS_OAUTH === 'true',
    museAccess, hostedAccess, hosted, oauthGrantDays: hosted ? 90 : 1,
    mcpToken: env.MCP_BEARER_TOKEN, adminToken: env.ADMIN_TOKEN, encryptionKey: env.DATA_ENCRYPTION_KEY,
    dataDir: env.DATA_DIR || '.data', allowedOrigins: (env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
    allowedHosts: new Set([parsed.host, `localhost:${env.PORT || 8787}`, `127.0.0.1:${env.PORT || 8787}`, ...(/^[a-z0-9-]+\.onrender\.com$/.test(env.RENDER_EXTERNAL_HOSTNAME || '') ? [env.RENDER_EXTERNAL_HOSTNAME] : [])]),
    housecall: { apiKey: env.HOUSECALL_API_KEY || '', companyId: env.HOUSECALL_TEST_COMPANY_ID || '', ownerId:env.HOUSECALL_TEST_OWNER_ID || '', writes: backend === 'housecall' && env.ENABLE_HOUSECALL_TEST_WRITES === 'true' },
    jobber: { clientId: env.JOBBER_CLIENT_ID || '', clientSecret: env.JOBBER_CLIENT_SECRET || '', accountId: env.JOBBER_TEST_ACCOUNT_ID || '',
      version: env.JOBBER_GRAPHQL_VERSION || '2026-09-25', callbackUrl: `${baseUrl}/oauth/jobber/callback`, writes }
  };
}
