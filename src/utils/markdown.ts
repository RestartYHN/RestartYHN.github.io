import { marked } from 'marked';

marked.use({
  gfm: true,
  breaks: true,
});

const EXT_REGEX = /\{(.+?)\}\((.+?)\)|!!(.+?)!!|==(.+?)==|\+\+(.+?)\+\+|\^(.+?)\{(.+?)\}\^|\^(.+?)\^/g;

function processExt(text: string): string {
  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = EXT_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1] && match[2]) {
      const rt = match[2];
      if (rt.includes('|')) {
        const chars = Array.from(match[1]);
        const readings = rt.split('|');
        let ruby = '';
        for (let i = 0; i < Math.max(chars.length, readings.length); i++) {
          ruby += `${chars[i] || ''}<rt>${readings[i] || ''}</rt>`;
        }
        parts.push(`<ruby>${ruby}</ruby>`);
      } else {
        parts.push(`<ruby>${processExt(match[1])}<rt>${rt}</rt></ruby>`);
      }
    } else if (match[3]) {
      parts.push(`<span class="spoiler">${processExt(match[3])}</span>`);
    } else if (match[4]) {
      parts.push(`<span class="rainbow-text">${processExt(match[4])}</span>`);
    } else if (match[5]) {
      parts.push(`<span class="underline-text">${processExt(match[5])}</span>`);
    } else if (match[6]) {
      parts.push(`<span style="color:${match[7]}">${processExt(match[6])}</span>`);
    } else if (match[8]) {
      parts.push(`<span class="highlight-mark">${processExt(match[8])}</span>`);
    }
    lastIndex = EXT_REGEX.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.join('');
}

function preprocess(text: string): string {
  let prev = '';
  let res = text;
  while (res !== prev) {
    prev = res;
    res = processExt(res);
  }
  return res;
}

export function parseMarkdown(content: string): string {
  if (!content) return '';
  const result = marked.parse(preprocess(content));
  return typeof result === 'string' ? result : '';
}
