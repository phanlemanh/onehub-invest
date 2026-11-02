#!/usr/bin/env bash
# AC-5: chạy đủ ba chế độ, một chế độ đỏ không che chế độ sau. Build trước vì thieu-env đọc collector/dist.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
(cd collector && npm run build --silent) || exit 1
rc=0
for che_do in nguon-duy-nhat khong-lo-nguon thieu-env; do
  node scripts/s08-danh-muc/acceptance.mjs "$che_do" || rc=1
done
exit "$rc"
