#!/usr/bin/env bash
# E4, E5 (AC-4, AC-5): áp theo băm, một giao dịch, áp lần hai không đổi, đảo từng luật, lùi trọn — trên bản chép.
source "$(dirname "${BASH_SOURCE[0]}")/_chung.sh"
chay_db e4 pipeline node --test --test-concurrency=1 --test-name-pattern='BN-AC-4|BN-AC-5' tests/noi-du-an-nguon.itest.mjs
