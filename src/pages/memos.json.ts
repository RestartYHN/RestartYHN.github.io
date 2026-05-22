import { getMemos } from '@utils/content-utils';

export async function GET() {
  const memos = await getMemos();
  const sorted = memos.sort((a, b) => b.id.localeCompare(a.id));
  const data = sorted.map(m => ({
    date: m.id,
    body: m.body?.trim() || '',
  }));
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}
