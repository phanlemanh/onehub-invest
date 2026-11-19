#!/usr/bin/env bash
# GT5 E1 (AC-1): công tắc mặc định tắt. Trên BẢN CHÉP DB máy thu:
#   đường chuẩn = transform-zalo chạy từ sha origin/main (worktree tạm) → chụp S1;
#   nhánh, công tắc vắng → S2 = S1; thêm dòng bat=true rồi dòng bat=false (mới nhất) → S3 = S1;
#   bản nhân + dòng bat=true mới nhất → khác S1 (đối chứng dương, in số tin trước/sau);
#   hai đột biến trên bản nhân (đọc dòng công tắc cũ nhất · bộ tìm mã mới chạy cả khi tắt) → phải khác S1 (bắt được), ghim offer_id.
# Đầu ra trạng thái để duong-noi.sh dùng tiếp: GT5_GIU=1 thì giữ DB oneinvest_gt5_bat và bản chụp ở $GT5_RA.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
D=_acceptance/khoa-gom-hai-tang/probes/gt5-db.mjs
RA="${GT5_RA:-$(mktemp -d)}"; WT="$(mktemp -d)/main"; BASE=oneinvest_gt5_ct
U() { echo "postgres://oneinvest:oneinvest@localhost:5433/$1"; }
F1=pipeline/lib/gom-tin.mjs; F2=pipeline/transform-zalo.mjs; B1="$(mktemp)"; B2="$(mktemp)"; cp "$F1" "$B1"; cp "$F2" "$B2"
don() {
  cp "$B1" "$F1"; cp "$B2" "$F2"; rm -f "$B1" "$B2"
  git worktree remove --force "$WT" >/dev/null 2>&1 || true
  for t in $BASE ${BASE}_a ${BASE}_b; do node $D xoa $t >/dev/null 2>&1 || true; done
  [ "${GT5_GIU:-}" = 1 ] || node $D xoa oneinvest_gt5_bat >/dev/null 2>&1 || true
}
trap don EXIT
RC=0
chay() { local db=$1 tep=$2; local t0=$SECONDS; DATABASE_URL="$(U $db)" node "$tep" > "$RA/log-$db-$(basename "$(dirname "$(dirname "$tep")")").txt" 2>&1 || { echo "ĐỎ: transform lỗi trên $db"; tail -5 "$RA"/log-$db-*.txt; exit 1; }; echo "  transform $db: $((SECONDS - t0))s"; }

SHA="$(git rev-parse origin/main)"; echo "đường chuẩn: origin/main $SHA"
git worktree add --detach "$WT" "$SHA" >/dev/null 2>&1 || { echo "ĐỎ: không dựng được worktree tạm"; exit 2; }
ln -s "$ROOT/pipeline/node_modules" "$WT/pipeline/node_modules" 2>/dev/null || ln -s "$(readlink "$ROOT/pipeline/node_modules")" "$WT/pipeline/node_modules"
bash db/db-thu.sh $BASE >/dev/null || { echo "ĐỎ: không chép được DB thử"; exit 2; }
chay $BASE "$WT/pipeline/transform-zalo.mjs"; DATABASE_URL="$(U $BASE)" node $D chup "$RA/s1.json"
echo "== công tắc vắng"; chay $BASE "$ROOT/$F2"; DATABASE_URL="$(U $BASE)" node $D chup "$RA/s2.json"; node $D so-sanh "$RA/s1.json" "$RA/s2.json" bang || RC=1
echo "== dòng mới nhất bat=false"
DATABASE_URL="$(U $BASE)" node $D cong-tac bat "dong cu"; DATABASE_URL="$(U $BASE)" node $D cong-tac tat "dong moi nhat"
chay $BASE "$ROOT/$F2"; DATABASE_URL="$(U $BASE)" node $D chup "$RA/s3.json"; node $D so-sanh "$RA/s1.json" "$RA/s3.json" bang || RC=1
node $D nhan $BASE ${BASE}_a >/dev/null; node $D nhan $BASE ${BASE}_b >/dev/null; node $D nhan $BASE oneinvest_gt5_bat >/dev/null
echo "== đột biến A: đọc dòng công tắc cũ nhất"
python3 - "$F1" <<'PY'
import sys; p=sys.argv[1]; t=open(p).read(); assert "ORDER BY id DESC LIMIT 1" in t; open(p,"w").write(t.replace("ORDER BY id DESC LIMIT 1","ORDER BY id ASC LIMIT 1"))
PY
chay ${BASE}_a "$ROOT/$F2"; cp "$B1" "$F1"; DATABASE_URL="$(U ${BASE}_a)" node $D chup "$RA/sa.json"
if node $D so-sanh "$RA/s1.json" "$RA/sa.json" bang >"$RA/a.txt"; then cat "$RA/a.txt"; echo "ĐỎ: thước mù — đột biến đọc dòng cũ nhất không bị bắt"; RC=1
else grep -E "ĐỎ" "$RA/a.txt" | sed 's/^ĐỎ/đạt (đột biến A bị bắt)/'; fi
echo "== đột biến B: bộ tìm mã mới chạy cả khi tắt"
python3 - "$F2" <<'PY'
import sys; p=sys.argv[1]; t=open(p).read()
a=': repostKey(pr, pr.post);'; assert a in t
t=t.replace(a, ': repostKey({ ...pr, ma: [...new Set([...(pr.ma ?? []), ...maMoiDB(gatSo(pr.post.text ?? ""))])] }, pr.post);')
t=t.replace('import { congTacGom } from "./lib/gom-tin.mjs";','import { congTacGom } from "./lib/gom-tin.mjs";\nimport { maMoi as maMoiDB } from "./lib/gom-tin-ma.mjs";')
open(p,"w").write(t)
PY
chay ${BASE}_b "$ROOT/$F2"; cp "$B2" "$F2"; DATABASE_URL="$(U ${BASE}_b)" node $D chup "$RA/sb.json"
if node $D so-sanh "$RA/s1.json" "$RA/sb.json" bang >"$RA/b.txt"; then cat "$RA/b.txt"; echo "ĐỎ: thước mù — đột biến bộ tìm mã khi tắt không bị bắt"; RC=1
else grep -E "ĐỎ" "$RA/b.txt" | sed 's/^ĐỎ/đạt (đột biến B bị bắt)/'; fi
echo "== dòng mới nhất bat=true (đối chứng dương)"
DATABASE_URL="$(U oneinvest_gt5_bat)" node $D cong-tac bat "doi chung duong"
DATABASE_URL="$(U oneinvest_gt5_bat)" node "$ROOT/$F2" >"$RA/log-bat.txt" 2>&1 || { tail -5 "$RA/log-bat.txt"; echo "ĐỎ: transform bật lỗi"; exit 1; }
grep -E "gom hai tầng|dedup:" "$RA/log-bat.txt"
DATABASE_URL="$(U oneinvest_gt5_bat)" node $D chup "$RA/s4.json"; node $D so-sanh "$RA/s1.json" "$RA/s4.json" khac || RC=1
cp "$(grep -o '→ .*\.tsv' "$RA/log-bat.txt" | sed 's/^→ //')" "$RA/bang-doi.tsv" 2>/dev/null || true
[ $RC = 0 ] && echo "XANH: cong-tac" || echo "ĐỎ: cong-tac"
exit $RC
