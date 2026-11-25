#!/usr/bin/env bash
# Chạy ca của một tiêu chí (doc.sh AC-3) hay cả hai tệp (doc.sh). Không chạm DB máy thu và không chép nó: các ca tự dựng DB rỗng riêng từ
# db/migrations (pipeline/scripts/db-thu-dbv.mjs, tên mang pid). DATABASE_URL trỏ một DB không tồn tại, nên lời gọi nào lọt ra ngoài DB riêng
# của ca thì đỏ chứ không đọc nhầm DB thật.
# Khi lọc theo tiêu chí, chỉ nạp tệp có ca mang đúng tên: tệp không có ca khớp vẫn chạy hook before (dựng DB) mà không chạy after, nên
# kết nối DB giữ tiến trình sống mãi (treo 29 phút ở lượt chấm 1 với AC-6, AC-8).
set -euo pipefail
goc="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$goc/app"
tep=(tests/can-cung-tieu-chi.test.tsx tests/can-cung-tieu-chi-bam.test.tsx)
mau=()
if [ -n "${1:-}" ]; then
  mau=(--test-name-pattern="CG17-$1 ")
  chon=()
  for t in "${tep[@]}"; do grep -q "\"CG17-$1 " "$t" && chon+=("$t"); done
  [ ${#chon[@]} -gt 0 ] || { echo "doc.sh: không tệp nào có ca CG17-$1" >&2; exit 2; }
  tep=("${chon[@]}")
fi
export DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/oneinvest_suite_cg17_khong_dung"
# Trần thời gian: mỗi ca 300 giây (--test-timeout), cả lệnh 600 giây (perl alarm — macOS không có lệnh timeout); quá trần thoát 142.
exec perl -e 'alarm shift; exec @ARGV or die "doc.sh: không chạy được node\n"' 600 \
  node --import tsx --test --test-concurrency=1 --test-timeout=300000 ${mau[@]+"${mau[@]}"} "${tep[@]}"
