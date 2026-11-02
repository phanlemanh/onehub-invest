### S4 round 1 — wf_edd325e6-4c5 (15 agent, 49,803 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 16 | 9,260 | 32 | 756,777 | 126 |
| synthesize:report | claude-sonnet-5-5 | 2 | 7,093 | 4 | 33,761 | 40 |
| review:measurement | claude-opus-5-5 | 5 | 6,183 | 10 | 120,062 | 72 |
| review:bugs | claude-opus-5-5 | 11 | 5,438 | 24 | 447,403 | 75 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,604 | 4 | 21,946 | 20 |
| triage | claude-sonnet-5-5 | 2 | 3,515 | 4 | 21,822 | 28 |
| machine:bash db/db-thu.sh oneinvest_p1_n4 && cd | claude-haiku-5-5 | 2 | 2,568 | 4 | 21,219 | 28 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,310 | 4 | 21,044 | 17 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,105 | 4 | 18,014 | 81 |
| machine:bash db/db-thu.sh oneinvest_p1_n3 && cd | claude-haiku-5-5 | 2 | 2,066 | 4 | 21,278 | 40 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,896 | 4 | 20,673 | 9 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 1,661 | 4 | 20,653 | 69 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,145 | 4 | 20,678 | 28 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 634 | 4 | 20,667 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 325 | 4 | 16,419 | 5 |


wall: 284s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,604 | 21,946 | 20 | 01:22:16 | 01:22:36 |
| machine | 8 | 14,385 | 164,226 | 211 | 01:22:16 | 01:25:47 |
| review | 3 | 20,881 | 1,324,242 | 126 | 01:22:16 | 01:24:22 |
| triage | 1 | 3,515 | 21,822 | 28 | 01:25:47 | 01:26:15 |
| capture | 1 | 325 | 16,419 | 5 | 01:26:15 | 01:26:20 |
| synthesize | 1 | 7,093 | 33,761 | 40 | 01:26:20 | 01:27:00 |

- **claude-opus-5-5**: 3 agent · 32 calls · out 20,881 · in 66 · cache_read 1,324,242 · cache_create 190,807
- **claude-sonnet-5-5**: 4 agent · 8 calls · out 14,537 · in 16 · cache_read 93,948 · cache_create 121,010
- **claude-haiku-5-5**: 8 agent · 16 calls · out 14,385 · in 32 · cache_read 164,226 · cache_create 158,712

### S4 round 2 — wf_6498e116-280 (16 agent, 35,622 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 6 | 6,565 | 12 | 183,001 | 75 |
| synthesize:report | claude-sonnet-5-5 | 4 | 6,561 | 8 | 112,977 | 41 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,058 | 4 | 21,169 | 19 |
| machine:bash db/db-thu.sh oneinvest_p1_n3 && cd | claude-haiku-5-5 | 2 | 2,603 | 4 | 21,257 | 74 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,387 | 4 | 21,010 | 57 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,156 | 4 | 17,982 | 71 |
| triage | claude-sonnet-5-5 | 2 | 1,976 | 4 | 20,675 | 17 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,899 | 4 | 21,024 | 9 |
| review:bugs | claude-opus-5-5 | 5 | 1,588 | 10 | 99,060 | 23 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,483 | 4 | 21,030 | 8 |
| refute:dac-trung-s06.test.mjs | claude-sonnet-5-5 | 3 | 1,262 | 6 | 40,116 | 13 |
| review:conventions | claude-opus-5-5 | 4 | 1,083 | 8 | 71,063 | 16 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,072 | 4 | 21,035 | 16 |
| refute:do-dac-trung-s06.mjs | claude-sonnet-5-5 | 2 | 1,018 | 4 | 19,803 | 10 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 585 | 4 | 21,012 | 10 |
| capture:provenance | claude-sonnet-5-5 | 2 | 326 | 4 | 16,776 | 6 |


wall: 248s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,058 | 21,169 | 19 | 02:26:21 | 02:26:40 |
| machine | 7 | 12,185 | 144,350 | 172 | 02:26:21 | 02:29:13 |
| review | 3 | 9,236 | 353,124 | 77 | 02:26:21 | 02:27:38 |
| triage | 1 | 1,976 | 20,675 | 17 | 02:29:13 | 02:29:30 |
| refute | 2 | 2,280 | 59,919 | 13 | 02:29:30 | 02:29:42 |
| capture | 1 | 326 | 16,776 | 6 | 02:29:42 | 02:29:48 |
| synthesize | 1 | 6,561 | 112,977 | 41 | 02:29:48 | 02:30:29 |

- **claude-opus-5-5**: 3 agent · 15 calls · out 9,236 · in 30 · cache_read 353,124 · cache_create 104,333
- **claude-sonnet-5-5**: 6 agent · 15 calls · out 14,201 · in 30 · cache_read 231,516 · cache_create 163,450
- **claude-haiku-5-5**: 7 agent · 14 calls · out 12,185 · in 28 · cache_read 144,350 · cache_create 141,530

### S4 round 3 — wf_e9d987c2-a52 (13 agent, 28,050 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 7 | 5,304 | 14 | 232,579 | 57 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,863 | 4 | 21,199 | 17 |
| machine:bash db/db-thu.sh oneinvest_p1_n3 && cd | claude-haiku-5-5 | 2 | 2,745 | 4 | 21,287 | 75 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,529 | 4 | 21,040 | 58 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,346 | 4 | 21,046 | 69 |
| review:measurement | claude-opus-5-5 | 4 | 2,320 | 8 | 76,606 | 32 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,231 | 4 | 21,042 | 15 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,998 | 4 | 21,060 | 9 |
| review:bugs | claude-opus-5-5 | 5 | 1,869 | 10 | 108,401 | 27 |
| review:conventions | claude-opus-5-5 | 6 | 1,588 | 12 | 121,584 | 25 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,295 | 4 | 21,065 | 17 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 623 | 4 | 21,054 | 7 |
| capture:provenance | claude-sonnet-5-5 | 2 | 339 | 4 | 16,806 | 7 |


wall: 237s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,863 | 21,199 | 17 | 02:32:44 | 02:33:01 |
| machine | 7 | 13,767 | 147,594 | 174 | 02:32:44 | 02:35:38 |
| review | 3 | 5,777 | 306,591 | 34 | 02:32:44 | 02:33:19 |
| capture | 1 | 339 | 16,806 | 7 | 02:35:38 | 02:35:45 |
| synthesize | 1 | 5,304 | 232,579 | 57 | 02:35:45 | 02:36:41 |

- **claude-sonnet-5-5**: 3 agent · 11 calls · out 8,506 · in 22 · cache_read 270,584 · cache_create 103,221
- **claude-haiku-5-5**: 7 agent · 14 calls · out 13,767 · in 28 · cache_read 147,594 · cache_create 138,904
- **claude-opus-5-5**: 3 agent · 15 calls · out 5,777 · in 30 · cache_read 306,591 · cache_create 89,210

