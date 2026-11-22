#!/bin/bash
# AC-1..AC-7 — bản sao script trong thư mục tạm, lượt detached nhóm riêng, fixture, DB cổng đóng
cd "$(dirname "$0")/../../.." && node --test --test-concurrency=1 scripts/zalo-import-tran.test.mjs
