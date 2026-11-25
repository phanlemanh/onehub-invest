#!/usr/bin/env bash
# E1 (AC-1): hàm thuần (rỗng giả 10 ô + chiều đỏ, tỉnh cũ, S10) rồi phép đo trên bản chép so với bộ đo S1 đóng băng.
source "$(dirname "${BASH_SOURCE[0]}")/_chung.sh"
(cd "$ROOT/pipeline" && node --test scripts/tinh-cu.test.mjs scripts/ban-ghi-nguon.test.mjs)
chay_db e1 pipeline node scripts/noi-du-an-nguon-that.mjs bo-chuyen
