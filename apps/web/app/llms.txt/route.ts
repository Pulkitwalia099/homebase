import { llmsIndex } from '@/lib/agent-documentation';
export function GET() { return new Response(llmsIndex, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=300' } }); }
