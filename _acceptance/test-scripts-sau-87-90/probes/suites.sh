#!/bin/bash
# Hai bộ test scripts/ đỏ trên main 257de57 phải xanh hết, không ca nào bị bỏ qua, job-exit không chờ thật.
# Chỉ đọc DB local :5433 qua schema tạm của chính bộ test (tự DROP/ROLLBACK). Ghi gì cũng vào thư mục tạm của test.
set -uo pipefail
R="${1:?gốc kho}"; cd "$R"
export DATABASE_URL="${DATABASE_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}"
bad=0
fr=$(node --test scripts/check-freshness.test.mjs 2>&1)
echo "$fr" | grep -E '^ℹ (tests|pass|fail|skipped) '
for l in 'ℹ fail 0' 'ℹ skipped 0'; do echo "$fr" | grep -qx "$l" || { echo "FRESHNESS thiếu «$l»"; bad=1; }; done
for t in 'GT-AC-1 importer thật nạp lại snapshot S06 cũ → stale, last = finishedAt' 'GT-AC-1 đối chứng: importer thật nạp snapshot thu 10 giờ → fresh'; do
  echo "$fr" | grep -qF "✔ $t" || { echo "FRESHNESS ca chưa xanh: $t"; bad=1; }
done
s=$SECONDS
je=$(node --test scripts/job-exit.test.mjs 2>&1); dt=$((SECONDS - s))
echo "$je" | grep -E '^ℹ (tests|pass|fail|skipped) '
for l in 'ℹ fail 0' 'ℹ skipped 0'; do echo "$je" | grep -qx "$l" || { echo "JOB-EXIT thiếu «$l»"; bad=1; }; done
for t in 'AC-2 apify-facebook-daily: mọi bước lành' 'AC-3 apify-facebook-daily · lành' 'AC-3 apify-facebook-daily · DB tắt hẳn' 'AC-3 ma trận đủ 10 ca' 'AC-5 chiều đỏ: bản sao push-ops-facts viết cứng localhost:5433'; do
  echo "$je" | grep -qF "✔ $t" || { echo "JOB-EXIT ca chưa xanh: $t"; bad=1; }
done
echo "job-exit chạy ${dt}s"
[ "$dt" -lt 60 ] || { echo "JOB-EXIT chạy ${dt}s ≥ 60s — tệp bọc vẫn chờ thật (sleep)"; bad=1; }
[ "$bad" = 0 ] && echo "SUITES OK"
exit "$bad"
