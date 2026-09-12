#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root_dir"

for command_name in node npm; do
  command -v "$command_name" >/dev/null 2>&1 || {
    echo "[ERROR] Missing command: $command_name" >&2
    exit 1
  }
done

required_node_major="$(tr -d '[:space:]' < .nvmrc | cut -d'.' -f1)"
current_node_major="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$current_node_major" != "$required_node_major" ]]; then
  echo "[ERROR] Node major version mismatch: required ${required_node_major}.x, current $(node -v)" >&2
  exit 1
fi

echo "[INFO] Installing locked dependencies"
npm ci

echo "[INFO] Validating and publishing Astro site"
./bin/blog-flow.sh release

echo "[OK] Release completed"
