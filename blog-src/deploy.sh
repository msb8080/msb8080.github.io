#!/usr/bin/env bash
# 构建 Astro，并仅更新 GitHub Pages 仓库中的 /blog/ 子目录。

set -euo pipefail

blog_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
site_dir="${RAINBOW_SITE_DIR:-$blog_dir/../minshuaibo-person-current/msb8080.github.io}"

if [[ ! -d "$site_dir/.git" || ! -f "$site_dir/index.html" ]]; then
  echo "Pages repository or its root homepage is unavailable: $site_dir" >&2
  exit 2
fi
if [[ -n "$(git -C "$site_dir" status --porcelain)" ]]; then
  echo "Pages repository has uncommitted changes; deployment stopped." >&2
  exit 2
fi
if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required for a scoped /blog/ deployment." >&2
  exit 2
fi

root_index_before="$(shasum -a 256 "$site_dir/index.html" | awk '{print $1}')"

cd "$blog_dir"
npm run build
mkdir -p "$site_dir/blog"
rsync -a --delete "$blog_dir/dist/" "$site_dir/blog/"

root_index_after="$(shasum -a 256 "$site_dir/index.html" | awk '{print $1}')"
if [[ "$root_index_before" != "$root_index_after" ]]; then
  echo "Root homepage changed unexpectedly; deployment stopped." >&2
  exit 2
fi

git -C "$site_dir" add blog
if git -C "$site_dir" diff --cached --quiet; then
  echo "No generated blog changes to publish."
  exit 0
fi

git -C "$site_dir" commit -m "deploy: update blog $(date '+%Y-%m-%d %H:%M')"
git -C "$site_dir" pull --rebase origin master
git -C "$site_dir" push origin master

npm run smoke -- https://msb8080.github.io/blog/

echo "Published: https://msb8080.github.io/blog/"
