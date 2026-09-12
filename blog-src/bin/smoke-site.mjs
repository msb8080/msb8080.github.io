const baseUrl = new URL(process.argv[2] ?? 'https://msb8080.github.io/blog/');
const attempts = 12;
const delayMs = 5000;
const cacheKey = Date.now().toString(36);

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchChecked(pathname, expectedType) {
  const url = pathname.startsWith('/') ? new URL(pathname, baseUrl.origin) : new URL(pathname, baseUrl);
  url.searchParams.set('__smoke', cacheKey);
  const response = await fetch(url, {
    redirect: 'follow',
    cache: 'no-store',
    headers: { 'cache-control': 'no-cache' }
  });
  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  if (expectedType && !contentType.includes(expectedType)) throw new Error(`${url}: unexpected content-type ${contentType}`);
  return response;
}

async function checkOnce() {
  const homeResponse = await fetchChecked('', 'text/html');
  const home = await homeResponse.text();
  for (const expected of ['application/ld+json', 'og:image', '/blog/favicon.svg']) {
    if (!home.includes(expected)) throw new Error(`Homepage is missing ${expected}`);
  }
  const stylesheet = home.match(/<link rel="stylesheet" href="([^"]+)"/)?.[1];
  if (!stylesheet) throw new Error('Homepage stylesheet was not found');

  await Promise.all([
    fetchChecked(stylesheet, 'text/css'),
    fetchChecked('assets/og-default.jpg', 'image/jpeg'),
    fetchChecked('favicon.svg', 'image/svg+xml'),
    fetchChecked('search.json', 'application/json'),
    fetchChecked('series/agent-harness/', 'text/html'),
    fetchChecked('2026/09/04/frontier-model-release-radar/', 'text/html')
  ]);
}

let lastError;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    await checkOnce();
    console.log(`[OK] Production smoke test passed: ${baseUrl}`);
    process.exit(0);
  } catch (error) {
    lastError = error;
    if (attempt < attempts) {
      console.log(`[WAIT] Site is not ready (${attempt}/${attempts}); retrying in ${delayMs / 1000}s.`);
      await wait(delayMs);
    }
  }
}

throw lastError;
