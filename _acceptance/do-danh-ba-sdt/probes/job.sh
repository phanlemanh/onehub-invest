#!/bin/bash
# E4 (do-danh-ba-sdt): bước do-danh-ba-sdt là job_run cuối của scripts/cloud-sync.sh, sau bac-du-lieu; dòng kiểm fail không đổi
# mã thoát, lệnh hỏng thì job ≠ 0 kèm dòng JOB FAIL. Hộp thử: chép cloud-sync.sh vào thư mục tạm, thay mọi lệnh node bằng giả.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
F=scripts/cloud-sync.sh
bash -n "$F" || { echo "BASH -n DO"; exit 1; }
kiem_thu_tu() {
  local cuoi bac ddb
  cuoi=$(grep -n '^job_run ' "$1" | tail -1 | cut -d: -f1)
  bac=$(grep -n '^job_run cloud-sync bac-du-lieu ' "$1" | cut -d: -f1)
  ddb=$(grep -n '^job_run cloud-sync do-danh-ba-sdt node "\$ROOT/pipeline/do-danh-ba-sdt.mjs" --write$' "$1" | cut -d: -f1)
  [ -n "$ddb" ] && [ -n "$bac" ] && [ "$ddb" -gt "$bac" ] && [ "$ddb" = "$cuoi" ] || { echo "SAI THU TU BUOC"; return 1; }
}
kiem_thu_tu "$F" || exit 1
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
sai="$T/sai.sh"; awk '/^job_run cloud-sync do-danh-ba-sdt/{next} {print} /^job_run cloud-sync push-ops-facts/{print "job_run cloud-sync do-danh-ba-sdt node \"$ROOT/pipeline/do-danh-ba-sdt.mjs\" --write"}' "$F" > "$sai"
if kiem_thu_tu "$sai" >/dev/null; then echo "DOI CHUNG THU TU KHONG BAT"; exit 1; fi
echo "doi chung: buoc dat truoc bac-du-lieu → SAI THU TU BUOC"
mkdir -p "$T/scripts/lib" "$T/pipeline" "$T/bin"
cp scripts/lib/job-step.sh "$T/scripts/lib/"; cp "$F" "$T/scripts/cloud-sync.sh"
printf '#!/bin/bash\ncase "$*" in *do-danh-ba-sdt.mjs*) echo "danh-ba-sdt:n1 S03 fail so=1 tong=1"; exit "${DDB_MA:-0}";; esac\nexit 0\n' > "$T/bin/node"; chmod +x "$T/bin/node"
sed -i '' 's#^NODE_BIN=.*#NODE_BIN="'"$T"'/bin"#' "$T/scripts/cloud-sync.sh"
bash "$T/scripts/cloud-sync.sh" >/dev/null 2>&1; ma=$?
[ "$ma" -eq 0 ] || { echo "DONG FAIL LAM JOB DO: $ma"; exit 1; }
out=$(DDB_MA=1 bash "$T/scripts/cloud-sync.sh" 2>&1); ma=$?
[ "$ma" -ne 0 ] && echo "$out" | grep -q 'JOB FAIL \[cloud-sync\] bước do-danh-ba-sdt' || { echo "LENH HONG KHONG LAM JOB DO"; echo "$out" | tail -5; exit 1; }
echo "JOB OK"
