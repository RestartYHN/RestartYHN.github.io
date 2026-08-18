import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const args = process.argv.slice(2);
if (args.length < 4) {
  console.error('Usage: pnpm newsignature <subtitleZh> <creditZh> <subtitleEn> <creditEn>');
  process.exit(1);
}

const [subtitleZh, creditZh, subtitleEn, creditEn] = args;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const baseDir = join(__dirname, '..', 'src', 'i18n', 'language');

function formatStringLiteral(value) {
  return JSON.stringify(value);
}

function appendToArrayBlock(raw, blockName, entryLines) {
  const lines = raw.split('\n');
  const blockIndex = lines.findIndex(line => line.trim() === `${blockName}: {`);

  if (blockIndex === -1) {
    return raw;
  }

  const homeIndex = lines.findIndex((line, index) => index > blockIndex && line.trim() === 'home: [');

  if (homeIndex === -1) {
    return raw;
  }

  const closeIndex = lines.findIndex((line, index) => index > homeIndex && line.trim() === '],');

  if (closeIndex === -1) {
    return raw;
  }

  const itemIndent = lines[homeIndex + 1]?.match(/^\s*/)?.[0] ?? '                ';
  const formattedLines = entryLines.map(line => `${itemIndent}${line}`);

  lines.splice(closeIndex, 0, ...formattedLines);
  return lines.join('\n');
}

async function appendToFile(filePath, subtitle, credit) {
  let raw = await readFile(filePath, 'utf-8');
  const subtitleLiteral = formatStringLiteral(subtitle);
  const creditLiteral = formatStringLiteral(credit);

  raw = appendToArrayBlock(raw, 'rotatingSubTitle', [`${subtitleLiteral},`]);
  raw = appendToArrayBlock(raw, 'rotatingPair', [
    '{',
    `    subTitle: ${subtitleLiteral},`,
    `    credit: ${creditLiteral},`,
    '},',
  ]);

  await writeFile(filePath, raw, 'utf-8');
}

await appendToFile(join(baseDir, 'zh-cn.ts'), subtitleZh, creditZh);
await appendToFile(join(baseDir, 'en.ts'), subtitleEn, creditEn);

console.log('Added signature to both language files.');
