import { getMemos } from '@utils/content-utils';
import type { CollectionEntry } from 'astro:content';

export async function GET() {
  const memos = await getMemos();
  const sorted = memos.sort((a: CollectionEntry<'memos'>, b: CollectionEntry<'memos'>) => b.id.localeCompare(a.id));
  const data = sorted.map((m: CollectionEntry<'memos'>) => ({
    date: m.id,
    body: m.body?.trim() || '',
  }));
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}
