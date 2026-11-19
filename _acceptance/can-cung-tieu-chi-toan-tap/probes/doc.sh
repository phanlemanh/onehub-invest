#!/usr/bin/env bash
# Chạy ca của một tiêu chí (doc.sh AC-3) hay cả hai tệp (doc.sh). Không chạm DB máy thu và không chép nó: các ca tự dựng DB rỗng riêng từ
# db/migrations (pipeline/scripts/db-thu-dbv.mjs, tên mang pid). DATABASE_URL trỏ một DB không tồn tại, nên lời gọi nào lọt ra ngoài DB riêng
# của ca thì đỏ chứ không đọc nhầm DB thật.
set -euo pipefail
goc="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$goc/app"
mau=()
[ -n "${1:-}" ] && mau=(--test-name-pattern="CG17-$1 ")
export DATABASE_URL="postgres://oneinvest:oneinvest@localhost:5433/oneinvest_suite_cg17_khong_dung"
exec node --import tsx --test --test-concurrency=1 ${mau[@]+"${mau[@]}"} tests/can-cung-tieu-chi.test.tsx tests/can-cung-tieu-chi-bam.test.tsx
