import { marked } from 'marked';

marked.use({
  gfm: true,
  breaks: true,
});

function preprocess(text: string): string {
  return text
    .replace(/\^(.+?)\{(.+?)\}\^/g, '<span style="color:$2">$1</span>')
    .replace(/\^(.+?)\^/g, '<span class="highlight-mark">$1</span>');
}

export function parseMarkdown(content: string): string {
  if (!content) return '';
  const result = marked.parse(preprocess(content));
  return typeof result === 'string' ? result : '';
}
