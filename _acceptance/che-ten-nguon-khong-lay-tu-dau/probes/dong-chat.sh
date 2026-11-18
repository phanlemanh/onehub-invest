#!/bin/bash
# AC-4 đóng chặt — ba ca sẵn có trên mã mới: sync-cloud (check-cloud-sync pii), push-ops-facts (NT2-AC-5), do-hang-ngay (DO1-AC-9)
cd "$(dirname "$0")/../../.." || exit 2
( cd pipeline && node scripts/check-cloud-sync.mjs pii ) || exit 1
node --test --test-name-pattern="NT2-AC-5|DO1-AC-9" pipeline/scripts/soat-tang-a.test.mjs pipeline/scripts/do-hang-ngay.test.mjs
