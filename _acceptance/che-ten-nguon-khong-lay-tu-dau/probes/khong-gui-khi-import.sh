#!/bin/bash
# AC-10 — nạp push-ops-facts.mjs không gửi bản tin; lệnh chính, chạy khô, symlink launchd đúng số lời gọi
cd "$(dirname "$0")/../../.." && node --test --test-concurrency=1 pipeline/scripts/push-ops-facts-import.test.mjs
