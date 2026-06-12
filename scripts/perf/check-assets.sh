#!/usr/bin/env bash
set -euo pipefail

# codex-os-managed
max_bytes="${ASSET_MAX_BYTES:-350000}"
mkdir -p .perf-results
fail=0
count=0
largest_file=""
largest_size=0
roots=()
if [[ -d public ]]; then
  roots+=("public")
fi
if [[ -d dist/assets ]]; then
  roots+=("dist/assets")
fi

if [[ ${#roots[@]} -eq 0 ]]; then
  cat > .perf-results/assets.json <<JSON
{
  "status": "not-run",
  "reason": "no asset roots found",
  "maxBytes": ${max_bytes}
}
JSON
  echo "No public or built asset directory found; skipping asset check."
  exit 0
fi

while IFS= read -r file; do
  size=$(wc -c < "$file")
  count=$((count + 1))
  if (( size > largest_size )); then
    largest_size=$size
    largest_file="$file"
  fi
  if (( size > max_bytes )); then
    echo "Asset too large (>${max_bytes} bytes): $file"
    fail=1
  fi
done < <(find "${roots[@]}" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp" -o -name "*.avif" -o -name "*.svg" -o -name "*.css" -o -name "*.js" \))

status="pass"
if (( fail != 0 )); then
  status="fail"
fi

roots_json=$(printf '"%s",' "${roots[@]}")
roots_json="[${roots_json%,}]"

cat > .perf-results/assets.json <<JSON
{
  "status": "${status}",
  "maxBytes": ${max_bytes},
  "checkedFiles": ${count},
  "largestFile": "${largest_file}",
  "largestSize": ${largest_size},
  "roots": ${roots_json}
}
JSON

exit $fail
