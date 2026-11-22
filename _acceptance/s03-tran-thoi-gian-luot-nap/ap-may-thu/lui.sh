#!/bin/bash
# lui.sh <sha commit gộp PR> — in lệnh lùi; không tự chạy, không đẩy gì.
set -euo pipefail
SHA="${1:?dùng: lui.sh <sha commit gộp>}"
git cat-file -e "$SHA^{commit}" 2>/dev/null || { echo "không có commit $SHA"; exit 2; }
echo "git switch -c revert/s03-tran-thoi-gian-luot-nap origin/main && git revert -m 1 $SHA && gh pr create --fill"
