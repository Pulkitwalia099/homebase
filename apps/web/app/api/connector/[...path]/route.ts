import { createGoLocalRelay } from '@/lib/golocal-relay.mjs';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

async function handle(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const relay = createGoLocalRelay({ keyHash: process.env.GOLOCAL_RELAY_TOKEN_SHA256, expiresAt: process.env.GOLOCAL_RELAY_EXPIRES_AT, hosted: process.env.GOLOCAL_RELAY_HOSTED === 'true' });
  return relay(request, path);
}

export const GET = handle;
export const POST = handle;
