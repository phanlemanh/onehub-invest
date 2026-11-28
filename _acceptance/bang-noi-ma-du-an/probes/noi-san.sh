#!/usr/bin/env bash
# E6 (AC-6): nối có sẵn thắng (S16 chép cứng), S08 và S09 bị từ chối (ba đường ghi S09, đối chứng S07), thẻ bóng S08 liệt 6 ca — trên bản chép; ca thuần khác nối sẵn.
source "$(dirname "${BASH_SOURCE[0]}")/_chung.sh"
chay_db e6 pipeline node --test --test-concurrency=1 --test-name-pattern='BN-AC-6' tests/noi-du-an-nguon.itest.mjs
(cd "$ROOT/pipeline" && node --test --test-name-pattern='BN-AC-6' scripts/khop-du-an.test.mjs)
