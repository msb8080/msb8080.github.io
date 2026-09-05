import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('css/homepage-v2.css', 'utf8');
const independentProjectPaths = new Set(['/codelens-ai/']);

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
const unsafeBlankLinks = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)]
  .map((match) => match[0])
  .filter((tag) => !/rel="[^"]*noopener/.test(tag));
const localReferences = [...html.matchAll(/(?:href|src)="(\/[^"]+)"/g)]
  .map((match) => match[1])
  .filter((reference) => !reference.startsWith('//'));
const missingReferences = localReferences.filter((reference) => {
  const pathname = reference.split(/[?#]/)[0];
  if (!pathname || independentProjectPaths.has(pathname)) return false;
  const target = resolve(decodeURIComponent(pathname.replace(/^\//, '')));
  return !existsSync(target) && !existsSync(resolve(target, 'index.html'));
});
const forbiddenRuntimeDependencies = [
  'cdn.tailwindcss.com',
  'cdnjs.cloudflare.com/ajax/libs/gsap',
  'minshuaibo-person.onrender.com'
].filter((value) => html.includes(value));
const requiredMetadata = [
  'rel="canonical"',
  'property="og:title"',
  'property="og:description"',
  'property="og:image"',
  'name="twitter:card"'
].filter((value) => !html.includes(value));
const navigationUsesRevealTransform = /<nav\b[^>]*class="[^"]*gsap-reveal/.test(html);
const requiredNavigationHooks = ['data-site-nav', 'nav-context', 'nav-link--primary']
  .filter((value) => !html.includes(value));
const cssBraceBalance = [...css].reduce(
  (balance, character) => balance + (character === '{' ? 1 : character === '}' ? -1 : 0),
  0
);

const failures = {
  duplicateIds,
  unsafeBlankLinks,
  missingReferences: [...new Set(missingReferences)],
  forbiddenRuntimeDependencies,
  requiredMetadata,
  navigationUsesRevealTransform: navigationUsesRevealTransform ? ['fixed navigation must not use transform-based reveal'] : [],
  requiredNavigationHooks,
  cssBraceBalance
};
const hasFailures = Object.values(failures).some((value) => Array.isArray(value) ? value.length : value !== 0);

if (hasFailures) {
  console.error('[FAIL] Homepage verification failed.');
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}

console.log(`[OK] Homepage verified: ${ids.length} unique IDs, ${localReferences.length} local references, progressive local runtime.`);
