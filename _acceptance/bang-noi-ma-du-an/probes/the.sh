#!/usr/bin/env bash
# E3 (AC-3): thẻ chỉ đọc, băm ổn định, không in mã, 20 mẫu mỗi căn cứ — trên bản chép.
source "$(dirname "${BASH_SOURCE[0]}")/_chung.sh"
chay_db e3 pipeline node --test --test-concurrency=1 --test-name-pattern='BN-AC-3' tests/noi-du-an-nguon.itest.mjs
(cd "$ROOT/pipeline" && node --test --test-name-pattern='BN-AC-3' scripts/khop-du-an.test.mjs)
