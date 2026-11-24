#!/usr/bin/env bash
# chi-them-mot-dong.sh — E3 (AC-3): khai ô của mọi lát khác không đổi so với nhánh chính.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
BASE="$(git merge-base HEAD origin/main)"
TAM="$ROOT/app/src/lib/.ht21-goc-$$.ts"
trap 'rm -f "$TAM"' EXIT
git show "$BASE:app/src/lib/labels-normalize.ts" > "$TAM"
cd app && node --import tsx -e '
  const [goc, moi] = await Promise.all([import(process.argv[1]), import("./src/lib/labels-normalize.ts")]);
  const a = goc.O_THEO_LAT, b = moi.O_THEO_LAT;
  console.log("trước:", JSON.stringify(a)); console.log("sau:  ", JSON.stringify(b));
  const doi = Object.keys(a).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
  const them = Object.keys(b).filter((k) => !(k in a));
  if (doi.length) { console.error("ĐỎ: lát cũ đổi khai ô: " + doi.join(", ")); process.exit(1); }
  if (JSON.stringify(them) !== JSON.stringify(["hai-khu-truc"])) { console.error("ĐỎ: lát thêm khác hai-khu-truc: " + them.join(", ")); process.exit(1); }
  console.log("XANH: chỉ thêm hai-khu-truc, lát cũ giữ nguyên");' "$TAM"
