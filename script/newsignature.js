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

async function appendToFile(filePath, subtitle, credit) {
  let raw = await readFile(filePath, 'utf-8');

  // append to rotatingSubTitle.home array
  raw = raw.replace(
    /(rotatingSubTitle:\s*\{\s*home:\s*\[[^\]]*?)(\]\s*,)/s,
    (_, head, tail) => `${head}    "${subtitle}",\n                ${tail}`
  );

  // append to rotatingPair.home array
  raw = raw.replace(
    /(rotatingPair:\s*\{\s*home:\s*\[[^\]]*?)(\]\s*,)/s,
    (_, head, tail) => `${head}    { subTitle: "${subtitle}", credit: "${credit}" },\n                ${tail}`
  );

  await writeFile(filePath, raw, 'utf-8');
}

await appendToFile(join(baseDir, 'zh-cn.ts'), subtitleZh, creditZh);
await appendToFile(join(baseDir, 'en.ts'), subtitleEn, creditEn);

console.log('Added signature to both language files.');
