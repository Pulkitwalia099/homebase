import { createPilotEmail } from '@/lib/pilot-email.mjs';
export const runtime = 'nodejs';
export const maxDuration = 20;
export async function POST(request: Request) {
  return createPilotEmail({keyHash:process.env.GOLOCAL_PILOT_EMAIL_KEY_SHA256,expiresAt:process.env.GOLOCAL_PILOT_EMAIL_EXPIRES_AT,resendKey:process.env.RESEND_API_KEY})(request);
}
