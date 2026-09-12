import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const basePath = '/blog';

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : target;
  }));
  return files.flat();
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function localPath(reference, pageFile) {
  if (/^(?:mailto:|tel:|javascript:|data:|#)/i.test(reference)) return null;
  const pageRoute = `/${path.relative(root, pageFile).replaceAll(path.sep, '/')}`.replace(/index\.html$/, '');
  let url;
  try {
    url = new URL(reference, `https://msb8080.github.io${basePath}${pageRoute}`);
  } catch {
    return null;
  }
  if (url.origin !== 'https://msb8080.github.io' || !url.pathname.startsWith(`${basePath}/`)) return null;
  const relative = decodeURIComponent(url.pathname.slice(basePath.length + 1));
  return path.join(root, relative.endsWith('/') || relative === '' ? relative : relative);
}

const files = await walk(root);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
const failures = [];
let references = 0;

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  for (const required of ['rel="canonical"', 'name="description"', 'application/ld+json']) {
    if (!html.includes(required)) failures.push(`${path.relative(root, file)}: missing ${required}`);
  }
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const reference = match[1];
    if (reference.includes('/_astro/')) failures.push(`${path.relative(root, file)}: Jekyll-unsafe asset path ${reference}`);
    const target = localPath(reference, file);
    if (!target) continue;
    references += 1;
    const url = new URL(reference, `https://msb8080.github.io${basePath}/`);
    const candidate = url.pathname.endsWith('/') ? path.join(target, 'index.html') : target;
    if (!(await exists(candidate))) failures.push(`${path.relative(root, file)}: unresolved ${reference}`);
  }
}

const home = await readFile(path.join(root, 'index.html'), 'utf8');
for (const expected of ['/blog/assets/og-default.jpg', '/blog/favicon.svg', 'summary_large_image']) {
  if (!home.includes(expected)) failures.push(`index.html: missing ${expected}`);
}
const searchIndex = JSON.parse(await readFile(path.join(root, 'search.json'), 'utf8'));
if (!Array.isArray(searchIndex) || searchIndex.length === 0) failures.push('search.json: empty or invalid index');

if (failures.length > 0) {
  console.error(failures.map((failure) => `[ERROR] ${failure}`).join('\n'));
  process.exit(1);
}

console.log(`[OK] Verified ${htmlFiles.length} HTML pages, ${references} local references and ${searchIndex.length} search records.`);
