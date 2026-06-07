#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

paths=(
  "src-tauri/target"
  "dist"
  "dist-ssr"
  "coverage"
  "node_modules/.vite"
)

printf 'Removing heavy build artifacts...\n'
for path in "${paths[@]}"; do
  if [ -e "${path}" ]; then
    rm -rf "${path}"
    printf '  removed %s\n' "${path}"
  else
    printf '  skipped %s (not present)\n' "${path}"
  fi
done

printf 'Heavy cleanup complete.\n'
