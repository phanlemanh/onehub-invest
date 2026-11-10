### S4 round 1 — wf_4c124184-2df (21 agent, 82,623 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 19 | 14,196 | 38 | 1,031,424 | 155 |
| review:bugs | claude-opus-5-5 | 12 | 11,495 | 24 | 599,182 | 124 |
| review:measurement | claude-opus-5-5 | 7 | 8,866 | 14 | 282,790 | 96 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 7,264 | 6 | 74,541 | 73 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,628 | 4 | 41,358 | 39 |
| machine:bash db/db-thu.sh oneinvest_suite_zik -- | claude-haiku-5-5 | 6 | 6,218 | 12 | 163,881 | 425 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 10 | 4,635 | 20 | 245,394 | 1204 |
| machine:cd app && npm test | claude-haiku-5-5 | 5 | 3,541 | 10 | 94,225 | 726 |
| triage | claude-sonnet-5-5 | 2 | 2,430 | 4 | 28,495 | 19 |
| machine:node --test scripts/job-exit.test.mjs | claude-haiku-5-5 | 2 | 2,376 | 4 | 28,143 | 19 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,156 | 4 | 28,034 | 8 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,941 | 4 | 24,936 | 40 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,744 | 4 | 28,028 | 8 |
| machine:node --test scripts/zalo-import-job.test | claude-haiku-5-5 | 2 | 1,659 | 4 | 28,145 | 14 |
| machine:node --test scripts/s03-nap-nhanh.test.m | claude-haiku-5-5 | 2 | 1,535 | 4 | 28,153 | 13 |
| machine:node --test scripts/enrich-buoc-job.test | claude-haiku-5-5 | 2 | 1,462 | 4 | 28,149 | 13 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,167 | 4 | 28,200 | 19 |
| machine:node --test scripts/zalo-import-job-lan. | claude-haiku-5-5 | 2 | 1,119 | 4 | 28,150 | 20 |
| machine:node --test scripts/cloud-sync-do.test.m | claude-haiku-5-5 | 2 | 958 | 4 | 28,149 | 9 |
| machine:node --test scripts/zalo-import-job-nhe. | claude-haiku-5-5 | 2 | 833 | 4 | 28,152 | 13 |
| capture:provenance | claude-sonnet-5-5 | 2 | 400 | 4 | 23,660 | 6 |


wall: 2071s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 7,264 | 74,541 | 73 | 11:55:25 | 11:56:38 |
| machine | 14 | 31,344 | 809,739 | 2006 | 11:55:25 | 12:28:51 |
| review | 3 | 34,557 | 1,913,396 | 155 | 11:55:25 | 11:58:00 |
| triage | 1 | 2,430 | 28,495 | 19 | 12:28:51 | 12:29:10 |
| capture | 1 | 400 | 23,660 | 6 | 12:29:10 | 12:29:16 |
| synthesize | 1 | 6,628 | 41,358 | 39 | 12:29:17 | 12:29:56 |

- **claude-opus-5-5**: 3 agent · 38 calls · out 34,557 · in 76 · cache_read 1,913,396 · cache_create 228,845
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 16,722 · in 18 · cache_read 168,054 · cache_create 157,868
- **claude-haiku-5-5**: 14 agent · 43 calls · out 31,344 · in 86 · cache_read 809,739 · cache_create 429,321

### S4 vòng 2 — s03-len-nhanh-nac-1 — wf_a3d0e508-662 (14 agent, 50,233 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 15 | 18,005 | 32 | 1,006,037 | 199 |
| review:measurement | claude-opus-5-5 | 8 | 7,371 | 18 | 347,083 | 77 |
| synthesize:report | claude-sonnet-5-5 | 4 | 5,318 | 8 | 147,604 | 40 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 9 | 4,305 | 18 | 215,289 | 1102 |
| review:conventions | claude-opus-5-5 | 7 | 3,057 | 16 | 211,485 | 33 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,639 | 4 | 25,183 | 34 |
| triage | claude-sonnet-5-5 | 2 | 1,706 | 4 | 27,579 | 17 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,640 | 4 | 28,384 | 7 |
| machine:cd app && npm test | claude-haiku-5-5 | 5 | 1,340 | 10 | 91,647 | 640 |
| refute:zalo-import-job-khoa.itest.mjs | claude-sonnet-5-5 | 2 | 1,231 | 4 | 24,212 | 13 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,139 | 4 | 28,390 | 5 |
| refute:zalo-import-job-khoa.itest.mjs | claude-sonnet-5-5 | 2 | 1,097 | 4 | 27,050 | 12 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,069 | 4 | 28,395 | 18 |
| capture:provenance | claude-sonnet-5-5 | 2 | 316 | 4 | 23,974 | 7 |


wall: 1883s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 6 | 12,132 | 417,288 | 1806 | 17:29:33 | 17:59:38 |
| review | 3 | 28,433 | 1,564,605 | 200 | 17:29:33 | 17:32:53 |
| triage | 1 | 1,706 | 27,579 | 17 | 17:59:38 | 17:59:55 |
| refute | 2 | 2,328 | 51,262 | 14 | 17:59:55 | 18:00:09 |
| capture | 1 | 316 | 23,974 | 7 | 18:00:09 | 18:00:15 |
| synthesize | 1 | 5,318 | 147,604 | 40 | 18:00:15 | 18:00:56 |

- **claude-opus-5-5**: 3 agent · 30 calls · out 28,433 · in 66 · cache_read 1,564,605 · cache_create 220,961
- **claude-sonnet-5-5**: 5 agent · 12 calls · out 9,668 · in 24 · cache_read 250,419 · cache_create 176,079
- **claude-haiku-5-5**: 6 agent · 22 calls · out 12,132 · in 44 · cache_read 417,288 · cache_create 219,350

