#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

LEAN_BASE_DIR="${LEAN_BASE_DIR:-${TMPDIR:-/tmp}}"
LEAN_WORK_DIR="$(mktemp -d "${LEAN_BASE_DIR%/}/ticketdocs-lean.XXXXXX")"
LEAN_CARGO_TARGET_DIR="${LEAN_WORK_DIR}/cargo-target"
LEAN_VITE_CACHE_DIR="${LEAN_WORK_DIR}/vite-cache"

cleanup() {
  local exit_code=$?
  rm -rf "${LEAN_WORK_DIR}"
  exit "${exit_code}"
}

trap cleanup EXIT INT TERM

mkdir -p "${LEAN_CARGO_TARGET_DIR}" "${LEAN_VITE_CACHE_DIR}"

printf 'Lean dev temp workspace: %s\n' "${LEAN_WORK_DIR}"
printf 'CARGO_TARGET_DIR: %s\n' "${LEAN_CARGO_TARGET_DIR}"
printf 'VITE_CACHE_DIR: %s\n' "${LEAN_VITE_CACHE_DIR}"
printf 'Temporary artifacts will be removed when this process exits.\n'

cd "${REPO_ROOT}"
CARGO_TARGET_DIR="${LEAN_CARGO_TARGET_DIR}" \
VITE_CACHE_DIR="${LEAN_VITE_CACHE_DIR}" \
pnpm tauri dev "$@"
