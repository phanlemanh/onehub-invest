#!/usr/bin/env bash
# DA64 probe-danh-ba-dem-theo-luat-nghi — E1 (AC-1, AC-2) trên DB của riêng lượt (db/db-thu.sh --chay: bản chép DB máy thu).
#   1. Probe TDB-DC (app/probes/registry-doi-chieu.test.tsx) xanh: dải số khớp đếm độc lập theo CÙNG luật nghỉ với doc.ts.
#   2. Ca phá: bản sao probe bỏ lọc nghỉ thì đỏ ở «TDB-DC dải số», và phanKhu đếm độc lập vượt phanKhu của doc.ts đúng bằng số nút
#      phân khu, toà mang meta.nghi = true trên cùng bản chép (25/11: 7).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT/app"
DOT="probes/.da64-dot-$$.test.tsx"
trap 'rm -f "$DOT"' EXIT
node -e '
  const fs = require("fs"); const [goc, ra] = process.argv.slice(1);
  const tu = " AND COALESCE((meta ->> '"'"'nghi'"'"')::boolean, false) = false`),";
  const s = fs.readFileSync(goc, "utf8");
  if (!s.includes(tu)) { console.error("đột biến không tìm thấy lọc nghỉ trong probe"); process.exit(3); }
  fs.writeFileSync(ra, s.replace(tu, "`),"));' probes/registry-doi-chieu.test.tsx "$DOT"
bash ../db/db-thu.sh "oneinvest_suite_da64_$$" --chay bash -c '
  set -uo pipefail
  node --import tsx --test probes/registry-doi-chieu.test.tsx > /tmp/da64-xanh-$$.log 2>&1; x=$?
  grep -E "^# TDB-DC dải số|^ℹ (pass|fail)" /tmp/da64-xanh-$$.log
  [ $x -eq 0 ] || { tail -40 /tmp/da64-xanh-$$.log; echo "ĐỎ: probe TDB-DC không xanh"; exit 1; }
  N=$(node -e "const pg=require(\"pg\");const c=new pg.Client({connectionString:process.env.DATABASE_URL});c.connect().then(()=>c.query(\"SELECT count(*)::int AS n FROM asset_nodes WHERE node_type <> '"'"'project'"'"' AND COALESCE((meta ->> '"'"'nghi'"'"')::boolean, false)\")).then(r=>{console.log(r.rows[0].n);return c.end()})")
  echo "nút phân khu, toà nghỉ trên bản chép: $N"
  if node --import tsx --test "'"$DOT"'" > /tmp/da64-do-$$.log 2>&1; then echo "ĐỎ: bỏ lọc nghỉ mà probe vẫn xanh"; exit 1; fi
  grep -q "TDB-DC dải số" /tmp/da64-do-$$.log || { tail -30 /tmp/da64-do-$$.log; echo "ĐỎ: ca phá không đỏ ở dải số"; exit 1; }
  A=$(grep -oE "actual: \{[^}]*phanKhu: [0-9]+" /tmp/da64-do-$$.log | grep -oE "phanKhu: [0-9]+" | grep -oE "[0-9]+" | head -1)
  E=$(grep -oE "expected: \{[^}]*phanKhu: [0-9]+" /tmp/da64-do-$$.log | grep -oE "phanKhu: [0-9]+" | grep -oE "[0-9]+" | head -1)
  echo "ca phá: doc.ts phanKhu $A, probe bỏ lọc nghỉ $E, chênh $((E - A))"
  [ "$((E - A))" -eq "$N" ] && [ "$N" -gt 0 ] || { echo "ĐỎ: chênh $((E - A)) khác số nút nghỉ $N"; exit 1; }
  rm -f /tmp/da64-xanh-$$.log /tmp/da64-do-$$.log
  echo "ca phá đỏ đúng $N nút nghỉ"'
