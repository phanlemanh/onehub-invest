#!/bin/bash
# kiem.sh — ZC20 s03-tai-bu-anh-bai-cu. Chạy trên collector/dist ĐÃ dựng (lệnh gọi build trước). Gốc kho suy từ vị trí tệp này.
#   (1) backfill-s03-media-2511.test.mjs trên cụm PostGIS DÙNG MỘT LẦN (db-thu.sh --chay-trong, DB trống từ migration) —
#       đòi tests ≥ 10, skipped 0, fail 0 (ca có DB không được tự bỏ qua)
#   (2) họ zalo-import (replay, job, job-lan, tran) với HOME + TMPDIR tạm, GIT_CONFIG_NOSYSTEM=1 — fail 0; hai ca replay có tên
#   (3) nap-argmax (BÁO 2510-5: khối liệt kê giống hệt bản apify) + AC-3 lối vào (entrypoint-symlink) — fail 0
#   (4) DATA-CONTRACT điều 7 (cắt riêng đoạn): 5 tên snapshot bù, cặp ngày–số 177·318·35·165, 695, hai chỗ nạp lại; đối chứng 318→319 đỏ
#   (5) đột biến trên bản chép: bỏ nhánh replay của zalo-import-daily.sh → ca «replay state 0» ĐỎ;
#       sapXepReplay giữ nguyên thứ tự → ca «sapXepReplay: snapshot bù … phase cuối» ĐỎ; (5c) luôn đi replay → ca «lượt thường» ĐỎ;
#       (5d) lệch khối liệt kê → nap-argmax ĐỎ; (5e) không nhận 403 → ca «http-403 dừng HẲN» ĐỎ
# In «ZC20 PASS» (mã 0) hoặc từng dòng FAIL (mã 1). Không mạng ngoài, không chạm cụm DB thật, không chạm ~/.openclaw.
set -uo pipefail
R="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$R"; FAIL=0
T=$(mktemp -d "${TMPDIR:-/tmp}/zc20-kiem.XXXXXX"); trap 'cp "$T/daily.goc" scripts/zalo-import-daily.sh 2>/dev/null; cp "$T/bf.goc" pipeline/backfill-s03-media-2511.mjs 2>/dev/null; rm -rf "$T"' EXIT
cp scripts/zalo-import-daily.sh "$T/daily.goc"; cp pipeline/backfill-s03-media-2511.mjs "$T/bf.goc"
dem() { echo "$1" | sed -n "s/^ℹ $2 //p" | tail -1; }
ZEnv() { HOME="$T/h" TMPDIR="$T/h" GIT_CONFIG_NOSYSTEM=1 "$@"; }; mkdir -p "$T/h"
ZTEST="scripts/zalo-import-replay.test.mjs scripts/zalo-import-job.test.mjs scripts/zalo-import-job-lan.test.mjs scripts/zalo-import-tran.test.mjs"

# (1)
out=$(bash db/db-thu.sh oneinvest_suite_zc20 --chay-trong node --test pipeline/backfill-s03-media-2511.test.mjs 2>&1); rc=$?
if [ $rc = 0 ] && [ "$(dem "$out" fail)" = 0 ] && [ "$(dem "$out" skipped)" = 0 ] && [ "$(dem "$out" tests)" -ge 10 ]; then echo "PASS (1) backfill trên DB dùng một lần: $(dem "$out" pass)/$(dem "$out" tests), skipped 0"; else echo "FAIL (1) backfill: mã $rc, tests $(dem "$out" tests), fail $(dem "$out" fail), skipped $(dem "$out" skipped)"; FAIL=1; fi
# ca nêu tên ở E1, E4, E5 phải có dòng ✔ (xoá hay đổi tên ca thì đỏ — gap-probe P1)
for ca in "sapXepReplay: snapshot bù (coverage.loai=tai-bu-anh-2511) luôn phase cuối" "(1) nạp lại raw theo thứ tự tên vẫn giữ ảnh đã bù" "(2) raw bất biến: snapshot gốc (tệp + manifest) giữ nguyên băm" "ghiSnapshotBuu: gặp http-403 dừng HẲN" "(3) trần lời gọi chặn TRƯỚC khi phát" "(c) dừng mềm giữa bài: bài chưa xong bị BỎ" "ghiSnapshotBuu: ảnh sống chép từ snapshot gốc + ảnh /jpg/400 tải lại qua fallback + 404 giữ nguyên"; do
  grep -qF "✔ $ca" <<<"$out" || { echo "FAIL (1) ca nêu tên không chạy xanh: «$ca»"; FAIL=1; }
done

# (2)
out=$(ZEnv node --test --test-concurrency=1 $ZTEST 2>&1); rc=$?
if [ $rc = 0 ] && [ "$(dem "$out" fail)" = 0 ] && grep -q '^✔ replay state 0: gốc 21/11 tên muộn nạp TRƯỚC' <<<"$out" && grep -q '^✔ lượt thường (LAST có mốc)' <<<"$out"; then echo "PASS (2) họ zalo-import $(dem "$out" pass)/$(dem "$out" tests), hai ca replay xanh"; else echo "FAIL (2) họ zalo-import: mã $rc, fail $(dem "$out" fail)"; FAIL=1; fi

# (3)
out=$(node --test scripts/nap-argmax.test.mjs 2>&1); rc=$?
[ $rc = 0 ] && [ "$(dem "$out" fail)" = 0 ] && echo "PASS (3) nap-argmax $(dem "$out" pass)/$(dem "$out" tests)" || { echo "FAIL (3) nap-argmax: mã $rc, fail $(dem "$out" fail)"; FAIL=1; }
out=$(node --test --test-name-pattern="AC-3 không còn khuôn cũ" pipeline/scripts/entrypoint-symlink.test.mjs 2>&1); rc=$?
[ $rc = 0 ] && [ "$(dem "$out" pass)" = 1 ] && echo "PASS (3) AC-3 lối vào khuôn mới (backfill-s03-media-2511.mjs)" || { echo "FAIL (3) AC-3 lối vào: mã $rc"; FAIL=1; }

# (4) chỉ trong đoạn điều 7 của «Quy tắc tiêu thụ» (từ dòng «7. **Nạp lại stg» tới hết khối điều 7); cặp ngày–số đúng cặp
dieu7() { awk '/^7\. \*\*Nạp lại stg/{on=1} on && /^([0-9]+\. |#)/ && !/^7\. /{exit} on' "$1"; }
kiem_dc() { local d7 thieu=""; d7=$(dieu7 "$1"); [ -n "$d7" ] || { echo "không thấy điều 7"; return 1; }
  for x in 'tai-bu-anh-2511' '2026-11-21T143738670' '22T140520119' '23T134413716' '24T131547604' '25T125516859' 'sapXepReplay()' 'zalo-import-daily.sh' 'finalize-hanoi.sh'; do grep -qF "$x" <<<"$d7" || thieu="$thieu «$x»"; done
  tr '\n' ' ' <<<"$d7" | tr -s ' ' | grep -qE '21/11 177 · 22/11 318 · 23/11 35 · 24/11 165' || thieu="$thieu «cặp ngày–số 177·318·35·165»"
  tr '\n' ' ' <<<"$d7" | grep -qE '695 bài' || thieu="$thieu «695 bài»"
  [ -z "$thieu" ] || { echo "thiếu:$thieu"; return 1; }; }
DC=collector/docs/DATA-CONTRACT.md
if r=$(kiem_dc "$DC"); then echo "PASS (4) DATA-CONTRACT điều 7: 5 snapshot bù, 695 bài theo ngày đúng cặp, sapXepReplay, hai chỗ nạp lại (zalo-import-daily, finalize-hanoi)"; else echo "FAIL (4) DATA-CONTRACT điều 7 $r"; FAIL=1; fi
sed 's/22\/11 318/22\/11 319/' "$DC" > "$T/dc-pha.md"
if kiem_dc "$T/dc-pha.md" >/dev/null; then echo "FAIL (4) đối chứng: đổi 318→319 trong điều 7 mà phép kiểm vẫn xanh"; FAIL=1; else echo "PASS (4) đối chứng: đổi 318→319 → phép kiểm điều 7 ĐỎ"; fi

# (5a) bỏ nhánh replay
python3 - scripts/zalo-import-daily.sh <<'PY' || { echo "FAIL (5a) mẫu lệch mã"; FAIL=1; }
import sys; p=sys.argv[1]; s=open(p).read(); a='if [ "$LAST" = "00000000T000000" ] && [ -n "$DANH_SACH" ]'
if s.count(a)!=1: sys.exit(1)
open(p,'w').write(s.replace(a,'if false && [ "$LAST" = "00000000T000000" ] && [ -n "$DANH_SACH" ]'))
PY
out=$(ZEnv node --test --test-concurrency=1 scripts/zalo-import-replay.test.mjs 2>&1)
cp "$T/daily.goc" scripts/zalo-import-daily.sh
grep -q '^✖ replay state 0' <<<"$out" && echo "PASS (5a) bỏ nhánh replay → ĐỎ «replay state 0»" || { echo "FAIL (5a) bỏ nhánh replay không làm đỏ ca replay state 0"; FAIL=1; }

# (5b) sapXepReplay giữ nguyên thứ tự
python3 - pipeline/backfill-s03-media-2511.mjs <<'PY' || { echo "FAIL (5b) mẫu lệch mã"; FAIL=1; }
import re,sys; p=sys.argv[1]; s=open(p).read()
m=re.search(r'export (async )?function sapXepReplay\(([a-zA-Z_]+)[^)]*\)\s*\{', s)
if not m: sys.exit(1)
s=s[:m.end()]+f' return {m.group(2)};'+s[m.end():]
open(p,'w').write(s)
PY
out=$(node --test --test-name-pattern="sapXepReplay" pipeline/backfill-s03-media-2511.test.mjs 2>&1)
cp "$T/bf.goc" pipeline/backfill-s03-media-2511.mjs
grep -q '^✖ sapXepReplay' <<<"$out" && echo "PASS (5b) sapXepReplay giữ nguyên thứ tự → ĐỎ «sapXepReplay: snapshot bù … phase cuối»" || { echo "FAIL (5b) đột biến sapXepReplay không làm đỏ ca đơn vị"; FAIL=1; }

# (5c) luôn đi nhánh replay (bỏ điều kiện LAST = 0) → ca «lượt thường» phải ĐỎ (gap-probe P1)
python3 - scripts/zalo-import-daily.sh <<'PY' || { echo "FAIL (5c) mẫu lệch mã"; FAIL=1; }
import sys; p=sys.argv[1]; s=open(p).read(); a='if [ "$LAST" = "00000000T000000" ] && [ -n "$DANH_SACH" ]'
if s.count(a)!=1: sys.exit(1)
open(p,'w').write(s.replace(a,'if [ -n "$DANH_SACH" ]'))
PY
out=$(ZEnv node --test --test-concurrency=1 scripts/zalo-import-replay.test.mjs 2>&1)
cp "$T/daily.goc" scripts/zalo-import-daily.sh
grep -q '^✖ lượt thường (LAST có mốc)' <<<"$out" && echo "PASS (5c) luôn đi replay → ĐỎ «lượt thường (LAST có mốc)…»" || { echo "FAIL (5c) luôn đi replay không làm đỏ ca lượt thường"; FAIL=1; }

# (5d) lệch khối liệt kê khỏi bản apify → nap-argmax phải ĐỎ (gap-probe P2)
python3 - scripts/zalo-import-daily.sh <<'PY' || { echo "FAIL (5d) mẫu lệch mã"; FAIL=1; }
import sys; p=sys.argv[1]; s=open(p).read(); a="echo \"bỏ qua thư mục TS không phải mốc thời gian: $d\" >&2; continue"
if s.count(a)!=1: sys.exit(1)
open(p,'w').write(s.replace(a,"echo \"bỏ qua thư mục TS sai mốc: $d\" >&2; continue"))
PY
out=$(node --test scripts/nap-argmax.test.mjs 2>&1)
cp "$T/daily.goc" scripts/zalo-import-daily.sh
grep -q '^✖ nap-argmax: khối liệt kê hai bản GIỐNG HỆT nhau' <<<"$out" && echo "PASS (5d) lệch khối liệt kê → ĐỎ «nap-argmax: khối liệt kê hai bản GIỐNG HỆT nhau»" || { echo "FAIL (5d) lệch khối liệt kê không làm đỏ nap-argmax"; FAIL=1; }

# (5e) không nhận ra 403/429 → ca «gặp http-403 dừng HẲN» phải ĐỎ (gap-probe P1)
python3 - pipeline/backfill-s03-media-2511.mjs <<'PY' || { echo "FAIL (5e) mẫu lệch mã"; FAIL=1; }
import sys; p=sys.argv[1]; s=open(p).read(); a='if (/http-(403|429)/.test(loi)) maChan ='
if s.count(a)!=1: sys.exit(1)
open(p,'w').write(s.replace(a,'if (false) maChan ='))
PY
out=$(node --test --test-name-pattern="http-403" pipeline/backfill-s03-media-2511.test.mjs 2>&1)
cp "$T/bf.goc" pipeline/backfill-s03-media-2511.mjs
grep -q '^✖ ghiSnapshotBuu: gặp http-403 dừng HẲN' <<<"$out" && echo "PASS (5e) bỏ nhận 403 → ĐỎ «ghiSnapshotBuu: gặp http-403 dừng HẲN»" || { echo "FAIL (5e) bỏ nhận 403 không làm đỏ ca 403"; FAIL=1; }

cmp -s scripts/zalo-import-daily.sh "$T/daily.goc" && cmp -s pipeline/backfill-s03-media-2511.mjs "$T/bf.goc" || { echo "FAIL khôi phục bản gốc sau đột biến"; FAIL=1; }
[ $FAIL = 0 ] && echo "ZC20 PASS"
exit $FAIL
