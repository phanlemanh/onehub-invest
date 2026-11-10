#!/bin/bash
# E7 (thuoc-song-song-dem-theo-ten-ca, AC-6): app-test-chiu-song-song đã ghim lại bằng làn máy và lưới trước-gộp sạch
# trên phạm vi diff của PR (không --slug — hồ sơ khác bị kéo vào cũng tính).
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)" || exit 2; cd "$ROOT" || exit 2
H=_acceptance/app-test-chiu-song-song
bad=0

# kiem <run-log> <verified_commit> → in lỗi (GHIM LECH …) hoặc «ok <run_id> <sha>»
kiem() {
  node -e '
    const [log, vc] = process.argv.slice(1);
    const dong = require("fs").readFileSync(log, "utf8").split("\n").filter(Boolean)
      .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((j) => j && j.kind === "repin");
    const r = dong.at(-1);
    const loi = [];
    if (!r) loi.push("không có dòng repin");
    else {
      for (const e of ["E1", "E2", "E3", "E4", "E5"]) if (r.evals_exit?.[e] !== 0) loi.push(`${e}=${r.evals_exit?.[e]}`);
      if (!Array.isArray(r.suites_exit) || r.suites_exit.some((x) => x !== 0)) loi.push(`suites_exit=${JSON.stringify(r.suites_exit)}`);
      if (r.sha !== vc) loi.push(`sha ${r.sha} ≠ verified_commit ${vc}`);
    }
    console.log(loi.length ? `GHIM LECH: ${loi.join("; ")}` : `ok ${r.run_id} ${r.sha}`);
  ' "$1" "$2"
}
vc=$(sed -n 's/^verified_commit: *//p' "$H/evidence-report.md" | head -1)
kq=$(kiem "$H/run-log.jsonl" "$vc"); echo "# dòng repin cuối: $kq"
case "$kq" in ok\ *) ;; *) bad=1 ;; esac

# Đối chứng: verified_commit giả khác sha → GHIM LECH.
gia=$(kiem "$H/run-log.jsonl" "0000000000000000000000000000000000000000")
case "$gia" in "GHIM LECH"*) echo "# đối chứng verified_commit giả: GHIM LECH" ;; *) echo "DOI CHUNG KHONG BAT (ghim)"; bad=1 ;; esac

base=$(git merge-base origin/main HEAD) || { echo "KHONG TINH DUOC DIEM RE NHANH"; exit 2; }
luoi=$(bash scripts/pre-merge-check.sh . --base "$base" 2>&1); ma=$?
# Lượt chấm S4 của CHÍNH hồ sơ này chạy khi nó còn implemented, chưa có evidence-report: lưới báo đúng một dòng ấy.
# Chỉ bỏ qua nguyên văn dòng đó (khớp trọn dòng, đúng slug); mọi VIOLATION khác — kể cả của hồ sơ này — vẫn chặn.
TU="VIOLATION [thuoc-song-song-dem-theo-ten-ca]: status=implemented but no evidence-report.md"
tu=$(printf '%s\n' "$luoi" | grep -cxF "$TU")
vp=$(printf '%s\n' "$luoi" | grep -E "VIOLATION" | grep -vxF "$TU")
[ "$tu" -eq 0 ] || echo "# bỏ qua: hồ sơ này chưa có evidence-report (đang chấm S4)"
if [ -z "$vp" ] && { [ "$ma" -eq 0 ] || [ "$tu" -gt 0 ]; }; then echo "# lưới trước-gộp --base $base: sạch"
else printf '%s\n' "$vp" | head -20; echo "LUOI TRUOC GOP CHAN (thoát $ma)"; bad=1; fi
# Đối chứng: một VIOLATION khác của chính hồ sơ này không được bỏ qua.
gia2=$(printf '%s\n' "VIOLATION [thuoc-song-song-dem-theo-ten-ca]: evidence is stale" | grep -E "VIOLATION" | grep -vxF "$TU")
if [ -n "$gia2" ]; then echo "# đối chứng vi phạm khác của hồ sơ này: vẫn chặn"; else echo "DOI CHUNG KHONG BAT (bỏ qua quá rộng)"; bad=1; fi

[ "$bad" -eq 0 ] && echo "GHIM OK"
exit $bad
