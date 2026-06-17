import { marked } from 'marked';

marked.use({
  gfm: true,
  breaks: true,
});

export function parseMarkdown(content: string): string {
  if (!content) return '';
  const result = marked.parse(content);
  return typeof result === 'string' ? result : '';
}
