type SearchDocument = {
  title: string;
  description: string;
  text: string;
  tags: string[];
  date: string;
  url: string;
};

const root = document.documentElement;
const navToggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
const menu = document.querySelector<HTMLElement>('[data-site-menu]');
const searchLayer = document.querySelector<HTMLElement>('[data-search-layer]');
const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
const searchResults = document.querySelector<HTMLElement>('[data-search-results]');
const themeToggle = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
let searchDocuments: SearchDocument[] | null = null;
let searchReturnFocus: HTMLElement | null = null;

function syncThemeToggle() {
  if (!themeToggle) return;
  const isLight = root.dataset.theme === 'light';
  themeToggle.setAttribute('aria-pressed', String(isLight));
  themeToggle.setAttribute('aria-label', isLight ? '切换到深色主题' : '切换到浅色主题');
}

syncThemeToggle();

function closeMenu() {
  navToggle?.setAttribute('aria-expanded', 'false');
  menu?.classList.remove('is-open');
}

navToggle?.addEventListener('click', () => {
  const willOpen = navToggle.getAttribute('aria-expanded') !== 'true';
  navToggle.setAttribute('aria-expanded', String(willOpen));
  menu?.classList.toggle('is-open', willOpen);
});
menu?.addEventListener('click', closeMenu);

themeToggle?.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  localStorage.setItem('ai-composer-theme', next);
  syncThemeToggle();
});

function closeSearch() {
  if (!searchLayer || searchLayer.hidden) return;
  searchLayer.hidden = true;
  document.body.classList.remove('has-dialog');
  searchReturnFocus?.focus();
  searchReturnFocus = null;
}

function renderSearchResults(matches: SearchDocument[]) {
  if (!searchResults) return;
  searchResults.replaceChildren();
  if (!matches.length) {
    const empty = document.createElement('p');
    empty.className = 'search-empty';
    empty.textContent = '没有匹配结果，换个关键词试试。';
    searchResults.append(empty);
    return;
  }
  matches.forEach((item) => {
    const link = document.createElement('a');
    link.className = 'search-result';
    link.href = item.url;
    const time = document.createElement('time');
    time.textContent = item.date;
    const title = document.createElement('strong');
    title.textContent = item.title;
    const description = document.createElement('p');
    description.textContent = item.description;
    link.append(time, title, description);
    searchResults.append(link);
  });
}

async function openSearch(trigger?: HTMLElement | null) {
  if (!searchLayer || !searchInput) return;
  const activeElement = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
    ? document.activeElement
    : document.querySelector<HTMLElement>('[data-search-open]');
  searchReturnFocus = trigger ?? activeElement;
  searchLayer.hidden = false;
  document.body.classList.add('has-dialog');
  searchInput.focus();
  if (searchDocuments) return;
  try {
    const response = await fetch(searchLayer.dataset.indexUrl ?? './search.json');
    if (!response.ok) throw new Error(`Search index returned ${response.status}`);
    searchDocuments = await response.json();
  } catch {
    searchDocuments = [];
    if (searchResults) searchResults.textContent = '搜索索引加载失败，请稍后重试。';
  }
}

document.querySelectorAll<HTMLElement>('[data-search-open]').forEach((button) => button.addEventListener('click', () => void openSearch(button)));
document.querySelectorAll('[data-search-close]').forEach((button) => button.addEventListener('click', closeSearch));

searchLayer?.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  const focusable = [...searchLayer.querySelectorAll<HTMLElement>('button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), a[href]')]
    .filter((element) => element.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1)!;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

searchInput?.addEventListener('input', () => {
  if (!searchDocuments || !searchResults) return;
  const query = searchInput.value.trim().toLocaleLowerCase('zh-CN');
  if (!query) {
    searchResults.innerHTML = '<p class="search-empty">输入关键词开始搜索。</p>';
    return;
  }
  const matches = searchDocuments.filter((item) =>
    [item.title, item.description, item.text, ...item.tags].join(' ').toLocaleLowerCase('zh-CN').includes(query)
  ).slice(0, 10);
  renderSearchResults(matches);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { closeSearch(); closeMenu(); }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    void openSearch();
  }
});

const progress = document.querySelector<HTMLElement>('[data-reading-progress]');
if (progress && document.body.classList.contains('is-post')) {
  const updateProgress = () => {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${height > 0 ? window.scrollY / height : 0})`;
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
}

const toc = document.querySelector<HTMLElement>('[data-toc]');
if (toc) {
  const headings = [...document.querySelectorAll<HTMLElement>('.article-content h2, .article-content h3')];
  if (!headings.length) toc.textContent = '这篇文章没有分节。';
  headings.forEach((heading) => {
    const link = document.createElement('a');
    link.className = `toc-${heading.tagName.toLowerCase()}`;
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    toc.append(link);
  });
}

document.querySelector<HTMLButtonElement>('[data-copy-url]')?.addEventListener('click', async (event) => {
  await navigator.clipboard.writeText(window.location.href);
  (event.currentTarget as HTMLButtonElement).textContent = '已复制';
});

document.querySelectorAll<HTMLPreElement>('.article-content pre').forEach((pre) => {
  const button = document.createElement('button');
  button.className = 'copy-code';
  button.type = 'button';
  button.textContent = 'COPY';
  button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(pre.querySelector('code')?.textContent ?? '');
    button.textContent = 'COPIED';
    window.setTimeout(() => { button.textContent = 'COPY'; }, 1600);
  });
  pre.append(button);
});

const signalStage = document.querySelector<HTMLElement>('[data-signal-stage]');
const canTilt = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
if (signalStage && canTilt.matches) {
  signalStage.addEventListener('pointermove', (event) => {
    const bounds = signalStage.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    signalStage.style.setProperty('--tilt-x', `${(-y * 7).toFixed(2)}deg`);
    signalStage.style.setProperty('--tilt-y', `${(x * 9).toFixed(2)}deg`);
    signalStage.style.setProperty('--tilt-x-soft', `${(-y * 3).toFixed(2)}deg`);
    signalStage.style.setProperty('--tilt-y-soft', `${(x * 4).toFixed(2)}deg`);
  }, { passive: true });
  signalStage.addEventListener('pointerleave', () => {
    signalStage.style.setProperty('--tilt-x', '0deg');
    signalStage.style.setProperty('--tilt-y', '0deg');
    signalStage.style.setProperty('--tilt-x-soft', '0deg');
    signalStage.style.setProperty('--tilt-y-soft', '0deg');
  });
}
