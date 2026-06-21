import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const args = process.argv.slice(2);
if (args.length < 6) {
  console.error('Usage: pnpm newauthor <slug> <nameZh> <nameEn> <avatarUrl> <descZh> <descEn>');
  process.exit(1);
}

const [slug, nameZh, nameEn, avatarUrl, descZh, descEn] = args;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataPath = join(__dirname, '..', 'src', 'data', 'gallery.template.json');

const raw = await readFile(dataPath, 'utf-8');
const data = JSON.parse(raw);

if (data.authors.find(a => a.slug === slug)) {
  console.error(`Author "${slug}" already exists.`);
  process.exit(1);
}

const maxOrder = data.authors.reduce((max, a) => Math.max(max, a.order || 0), 0);

data.authors.push({
  slug,
  name: { 'zh-cn': nameZh, en: nameEn },
  description: { 'zh-cn': descZh, en: descEn },
  avatar: avatarUrl,
  order: maxOrder + 1,
  enabled: true
});

await writeFile(dataPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
console.log(`Registered author "${slug}" (order: ${maxOrder + 1})`);
