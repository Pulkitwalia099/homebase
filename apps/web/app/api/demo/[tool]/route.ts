import { demoToolNames, relayDemo } from '@/lib/public-demo-relay';
export const runtime = 'nodejs';
export const maxDuration = 20;
export async function POST(request: Request, context: { params: Promise<{ tool: string }> }) {
  const { tool } = await context.params;
  if (!demoToolNames.includes(tool)) return Response.json({ error: 'Unknown demo tool.' }, { status: 404 });
  return relayDemo(request, `/demo/api/tools/${tool}`);
}
