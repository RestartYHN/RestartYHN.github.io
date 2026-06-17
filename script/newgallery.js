import { readFile, writeFile } from 'fs/promises';
import { basename, extname, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const args = process.argv.slice(2);
if (args.length < 5) {
  console.error('Usage: pnpm newgallery <imageUrl> <authorSlug> <titleZh> <titleEn> <year> [tags...]');
  process.exit(1);
}

const [imageUrl, authorSlug, titleZh, titleEn, year, ...tags] = args;
const id = basename(imageUrl, extname(imageUrl));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataPath = join(__dirname, '..', 'src', 'data', 'gallery.template.json');

const raw = await readFile(dataPath, 'utf-8');
const data = JSON.parse(raw);

const author = data.authors.find(a => a.slug === authorSlug);
if (!author) {
  console.error(`Author "${authorSlug}" not found. Available: ${data.authors.map(a => a.slug).join(', ')}`);
  process.exit(1);
}

const autoTags = [`画师:${author.name['zh-cn']}`, ...tags];
const maxOrder = data.works.reduce((max, w) => Math.max(max, w.order || 0), 0);

const work = {
  id,
  author: authorSlug,
  title: { 'zh-cn': titleZh, en: titleEn },
  image: imageUrl,
  thumb: imageUrl,
  year: parseInt(year),
  tags: autoTags,
  enabled: true,
  order: maxOrder + 1,
  link: ''
};

data.works.push(work);
await writeFile(dataPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
console.log(`Added work "${id}" by ${authorSlug} (order: ${work.order})`);
