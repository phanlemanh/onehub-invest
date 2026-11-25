#!/usr/bin/env bash
# E6 (AC-6): nối có sẵn thắng (S09, S16 chép cứng), S08 từ chối, thẻ bóng S08 liệt 6 ca — trên bản chép; ca thuần khác nối sẵn.
source "$(dirname "${BASH_SOURCE[0]}")/_chung.sh"
chay_db e6 pipeline node --test --test-concurrency=1 --test-name-pattern='BN-AC-6' tests/noi-du-an-nguon.itest.mjs
(cd "$ROOT/pipeline" && node --test --test-name-pattern='BN-AC-6' scripts/khop-du-an.test.mjs)
