#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

paths=(
  "node_modules"
  "src-tauri/target"
  "src-tauri/gen"
  "dist"
  "dist-ssr"
  "coverage"
  ".eslintcache"
  ".cache"
)

printf 'Removing reproducible local caches/artifacts...\n'
for path in "${paths[@]}"; do
  if [ -e "${path}" ]; then
    rm -rf "${path}"
    printf '  removed %s\n' "${path}"
  else
    printf '  skipped %s (not present)\n' "${path}"
  fi
done

printf 'Full local cleanup complete.\n'
