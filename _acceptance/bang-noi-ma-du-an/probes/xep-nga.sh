#!/usr/bin/env bash
# E2 (AC-2): ma trận 12 ô viết trước của bộ khớp, các ô phụ, chiều đỏ «cung-tinh».
source "$(dirname "${BASH_SOURCE[0]}")/_chung.sh"
cd "$ROOT/pipeline" && node --test scripts/khop-du-an.test.mjs
