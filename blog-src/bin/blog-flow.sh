#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

usage() {
  cat <<USAGE
Usage: ./bin/blog-flow.sh <command>

Commands:
  check    Validate content and run a production build
  preview  Start local preview server
  release  Validate and deploy the Astro build
USAGE
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "[ERROR] Missing command: $1" >&2
    exit 1
  }
}

check_fs_permissions() {
  local issues=0

  if [[ -e "dist" && ! -w "dist" ]]; then
    echo "[ERROR] No write permission: dist/"
    issues=1
  fi

  if [[ "$issues" -ne 0 ]]; then
    echo "[HINT] Fix ownership and retry:"
    echo "  sudo chown -R \$(whoami):staff dist docs source/_posts source/_drafts bin"
    exit 1
  fi
}

collect_front_matter_targets() {
  local changed tracked_untracked

  changed="$(git diff --name-only -- 'source/_posts/*.md' 'source/_drafts/*.md' || true)"
  tracked_untracked="$(git ls-files --others --exclude-standard -- 'source/_posts/*.md' 'source/_drafts/*.md' || true)"

  {
    printf '%s\n' "$changed"
    printf '%s\n' "$tracked_untracked"
  } | awk 'NF' | sort -u
}

check_one_front_matter() {
  local file="$1"

  rg -q '^title:' "$file" || { echo "[ERROR] Missing title: $file"; exit 1; }
  rg -q '^date:' "$file" || { echo "[ERROR] Missing date: $file"; exit 1; }
  rg -q '^updated:' "$file" || { echo "[ERROR] Missing updated: $file"; exit 1; }
  rg -q '^description:' "$file" || { echo "[ERROR] Missing description: $file"; exit 1; }
  rg -q '^tags:' "$file" || { echo "[ERROR] Missing tags: $file"; exit 1; }
  rg -q '^categories:' "$file" || { echo "[ERROR] Missing categories: $file"; exit 1; }
}

check_front_matter() {
  local targets found=0

  targets="$(collect_front_matter_targets)"

  if [[ -z "$targets" ]]; then
    echo "[INFO] No changed posts/drafts found, checking all posts in source/_posts"
    for file in source/_posts/*.md; do
      [[ -e "$file" ]] || continue
      found=1
      echo "[INFO] Checking front matter: $file"
      check_one_front_matter "$file"
    done
  else
    while IFS= read -r file; do
      [[ -n "$file" ]] || continue
      [[ -f "$file" ]] || continue
      found=1
      echo "[INFO] Checking front matter: $file"
      check_one_front_matter "$file"
    done <<< "$targets"
  fi

  if [[ "$found" -eq 0 ]]; then
    echo "[WARN] No markdown files found under source/_posts or source/_drafts"
  fi
}

run_check() {
  require_cmd npm
  require_cmd rg

  echo "[INFO] Running workflow checks"
  check_fs_permissions
  check_front_matter

  echo "[INFO] npm run check"
  npm run check

  echo "[INFO] npm run build"
  npm run build

  echo "[OK] Check completed"
}

run_preview() {
  require_cmd npm
  echo "[INFO] Starting local preview on http://localhost:4321/blog/"
  npm run dev
}

run_release() {
  require_cmd npm
  require_cmd rg

  echo "[INFO] Checking content before deployment"
  check_fs_permissions
  check_front_matter
  npm run deploy
  echo "[OK] Release completed"
}


main() {
  if [[ $# -ne 1 ]]; then
    usage
    exit 1
  fi

  case "$1" in
    check)
      run_check
      ;;
    preview)
      run_preview
      ;;
    release)
      run_release
      ;;
    *)
      usage
      exit 1
      ;;
  esac
}

main "$@"
