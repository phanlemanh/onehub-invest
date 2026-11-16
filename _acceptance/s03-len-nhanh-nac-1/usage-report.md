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

### S4 vòng 3 — wf_88f165a0-977 (13 agent, 46,361 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 14 | 10,202 | 32 | 988,230 | 117 |
| review:measurement | claude-opus-5-5 | 9 | 6,763 | 20 | 434,546 | 82 |
| synthesize:report | claude-sonnet-5-5 | 5 | 5,520 | 10 | 197,030 | 41 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 9 | 5,391 | 18 | 221,271 | 1139 |
| machine:bash db/db-thu.sh oneinvest_suite_zik -- | claude-haiku-5-5 | 6 | 5,355 | 12 | 164,410 | 423 |
| review:conventions | claude-opus-5-5 | 7 | 3,439 | 14 | 241,071 | 43 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 4 | 2,331 | 8 | 87,951 | 47 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,003 | 4 | 28,931 | 8 |
| machine:cd app && npm test | claude-haiku-5-5 | 5 | 1,995 | 10 | 96,410 | 742 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,645 | 4 | 28,925 | 7 |
| triage | claude-sonnet-5-5 | 2 | 836 | 4 | 26,996 | 10 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 563 | 4 | 28,913 | 42 |
| capture:provenance | claude-sonnet-5-5 | 2 | 318 | 4 | 24,404 | 38 |


wall: 2073s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 7 | 19,283 | 656,811 | 1984 | 04:57:28 | 05:30:32 |
| review | 3 | 20,404 | 1,663,847 | 119 | 04:57:28 | 04:59:27 |
| triage | 1 | 836 | 26,996 | 10 | 05:30:32 | 05:30:42 |
| capture | 1 | 318 | 24,404 | 38 | 05:30:42 | 05:31:20 |
| synthesize | 1 | 5,520 | 197,030 | 41 | 05:31:20 | 05:32:01 |

- **claude-opus-5-5**: 3 agent · 30 calls · out 20,404 · in 66 · cache_read 1,663,847 · cache_create 233,725
- **claude-sonnet-5-5**: 3 agent · 9 calls · out 6,674 · in 18 · cache_read 248,430 · cache_create 120,571
- **claude-haiku-5-5**: 7 agent · 30 calls · out 19,283 · in 60 · cache_read 656,811 · cache_create 251,658

### S4 lượt 4 — wf_d8a704ad-020 (20 agent, 48,525 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 9 | 7,209 | 20 | 460,904 | 79 |
| synthesize:report | claude-sonnet-5-5 | 5 | 6,178 | 10 | 217,798 | 44 |
| machine:bash db/db-thu.sh oneinvest_suite_zik -- | claude-haiku-5-5 | 6 | 5,698 | 12 | 165,015 | 426 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 9 | 5,404 | 18 | 224,525 | 1080 |
| review:conventions | claude-opus-5-5 | 8 | 3,822 | 16 | 289,825 | 44 |
| review:measurement | claude-opus-5-5 | 5 | 3,769 | 12 | 135,394 | 44 |
| machine:cd app && npm test | claude-haiku-5-5 | 4 | 3,271 | 8 | 66,502 | 679 |
| machine:node --test scripts/job-exit.test.mjs | claude-haiku-5-5 | 2 | 2,401 | 4 | 29,029 | 21 |
| triage | claude-sonnet-5-5 | 2 | 1,703 | 4 | 28,266 | 18 |
| machine:node --test scripts/s03-nap-nhanh.test.m | claude-haiku-5-5 | 2 | 1,397 | 4 | 29,039 | 13 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,265 | 4 | 29,034 | 25 |
| machine:node --test scripts/enrich-buoc-job.test | claude-haiku-5-5 | 2 | 1,168 | 4 | 29,035 | 13 |
| machine:node --test scripts/cloud-sync-do.test.m | claude-haiku-5-5 | 2 | 914 | 4 | 29,035 | 8 |
| machine:node --test scripts/zalo-import-job-lan. | claude-haiku-5-5 | 2 | 828 | 4 | 29,036 | 21 |
| machine:node --test scripts/zalo-import-job-nhe. | claude-haiku-5-5 | 2 | 752 | 4 | 29,038 | 14 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 718 | 4 | 29,029 | 5 |
| machine:node --test scripts/zalo-import-job.test | claude-haiku-5-5 | 2 | 603 | 4 | 29,031 | 12 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 575 | 4 | 29,011 | 38 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 528 | 4 | 29,023 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 322 | 4 | 24,502 | 8 |


wall: 1900s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 14 | 25,522 | 775,382 | 1830 | 12:39:23 | 13:09:53 |
| review | 3 | 14,800 | 886,123 | 80 | 12:39:23 | 12:40:43 |
| triage | 1 | 1,703 | 28,266 | 18 | 13:09:53 | 13:10:12 |
| capture | 1 | 322 | 24,502 | 8 | 13:10:12 | 13:10:19 |
| synthesize | 1 | 6,178 | 217,798 | 44 | 13:10:19 | 13:11:03 |

- **claude-opus-5-5**: 3 agent · 22 calls · out 14,800 · in 48 · cache_read 886,123 · cache_create 193,001
- **claude-sonnet-5-5**: 3 agent · 9 calls · out 8,203 · in 18 · cache_read 270,566 · cache_create 136,621
- **claude-haiku-5-5**: 14 agent · 41 calls · out 25,522 · in 82 · cache_read 775,382 · cache_create 438,411

