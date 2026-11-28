#!/usr/bin/env bash
# doi-chung.sh — DA72 E4 (AC-4): đối chứng mã gốc. Dựng worktree tạm ở GOC (mặc định dad1be620 = origin/main lúc cắt hàng), chép
# TỆP CA HIỆN TẠI vào đó, chạy dưới db/db-thu.sh --chay của chính worktree tạm; đạt khi DA72-AC-1 và DA72-AC-3 ĐỎ với «khong-co-tinh».
# Không sửa cây đang chấm (lượt chấm chạy các lệnh song song). Worktree tạm xoá ở trap.
set -uo pipefail
ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel); cd "$ROOT"
GOC=${GOC:-dad1be620}
CA=pipeline/scripts/danh-ba-vat-the-dem-khu-thieu-tinh.itest.mjs
WT=$(mktemp -d "${TMPDIR:-/tmp}/da72-goc-XXXXXX")
trap 'git -C "$ROOT" worktree remove --force "$WT" >/dev/null 2>&1; rm -rf "$WT"' EXIT
git worktree add -q --detach "$WT" "$GOC" || { echo "doi-chung: không dựng được worktree $GOC"; exit 2; }
for m in app pipeline agent data-api; do [ -e "$ROOT/$m/node_modules" ] && ln -s "$(cd "$ROOT/$m/node_modules" && pwd -P)" "$WT/$m/node_modules"; done
cp "$ROOT/$CA" "$WT/$CA"
ra=$(cd "$WT" && bash db/db-thu.sh oneinvest_suite_da72_goc --chay node --test --test-concurrency=1 "$CA" 2>&1); ma=$?
echo "$ra" | grep -E "^(✔|✖) DA72|^ℹ (pass|fail)" | sort -u
loi=0
# DA73: mỗi ca phải đỏ VÌ khong-co-tinh — soát khối lỗi của chính ca ấy trong mục «failing tests», không dò toàn đầu ra.
khoi(){ echo "$ra" | awk -v ca="$1" '/^✖ failing tests:/{f=1;next} f&&/^✖ /{in_=(index($0,"✖ " ca)==1);next} f&&in_{print}'; }
for ca in DA72-AC-1 DA72-AC-3; do
  echo "$ra" | grep -q "^✖ $ca" || { echo "FAIL $ca không đỏ trên mã gốc $GOC"; loi=1; continue; }
  khoi "$ca" | grep -q "khong-co-tinh" || { echo "FAIL $ca đỏ nhưng không vì khong-co-tinh"; loi=1; }
done
[ $ma -ne 0 ] || { echo "FAIL tệp ca thoát 0 trên mã gốc"; loi=1; }
[ $loi -eq 0 ] && echo "ĐỐI CHỨNG: mã gốc đỏ đúng (khong-co-tinh) ở $GOC"
exit $loi
