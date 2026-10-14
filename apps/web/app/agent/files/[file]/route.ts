import { agentFiles } from '@/lib/agent-documentation';
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!Object.hasOwn(agentFiles, file)) return new Response('File not found.\n', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  const doc = agentFiles[file];
  return new Response(doc.body, { headers: { 'Content-Type': doc.type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=300' } });
}
