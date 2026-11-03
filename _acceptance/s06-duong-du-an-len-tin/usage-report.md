### S4 round 1 — wf_781ca6ed-a15 (22 agent, 94,298 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 12 | 24,541 | 26 | 1,052,053 | 251 |
| review:conventions | claude-opus-5-5 | 6 | 14,971 | 12 | 296,296 | 155 |
| review:measurement | claude-opus-5-5 | 6 | 14,070 | 12 | 295,911 | 142 |
| synthesize:report | claude-sonnet-5-5 | 2 | 9,312 | 4 | 36,548 | 50 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 4,893 | 4 | 25,031 | 28 |
| triage | claude-sonnet-5-5 | 2 | 4,107 | 4 | 25,569 | 28 |
| machine:bash db/db-thu.sh oneinvest_ds1 && cd pi | claude-haiku-5-5 | 4 | 2,525 | 8 | 70,389 | 51 |
| machine:bash db/db-thu.sh oneinvest_ds1_do && cd | claude-haiku-5-5 | 2 | 2,399 | 4 | 24,938 | 15 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,288 | 4 | 22,912 | 244 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,167 | 4 | 22,926 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,658 | 4 | 22,920 | 9 |
| refute:s06-duong.itest.mjs | claude-sonnet-5-5 | 3 | 1,401 | 6 | 52,219 | 16 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 3 | 1,374 | 8 | 46,299 | 18 |
| refute:do-duong-s06.mjs | claude-sonnet-5-5 | 2 | 1,286 | 4 | 21,736 | 15 |
| machine:node --test pipeline/scripts/dac-trung-s | claude-haiku-5-5 | 2 | 1,257 | 4 | 22,937 | 7 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 1,122 | 4 | 22,906 | 59 |
| refute:s06-duong.itest.mjs | claude-sonnet-5-5 | 3 | 1,000 | 6 | 53,563 | 16 |
| machine:cd agent && node --import tsx --test tes | claude-haiku-5-5 | 2 | 995 | 4 | 22,936 | 8 |
| refute:s06-duong.itest.mjs | claude-sonnet-5-5 | 3 | 959 | 6 | 52,921 | 13 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 713 | 4 | 19,768 | 42 |
| capture:provenance | claude-sonnet-5-5 | 3 | 641 | 6 | 40,290 | 11 |
| refute:do-duong-s06.mjs | claude-sonnet-5-5 | 2 | 619 | 4 | 18,638 | 8 |


wall: 506s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,893 | 25,031 | 28 | 00:32:46 | 00:33:14 |
| machine | 10 | 16,498 | 298,931 | 390 | 00:32:46 | 00:39:16 |
| review | 3 | 53,582 | 1,644,260 | 252 | 00:32:46 | 00:36:57 |
| triage | 1 | 4,107 | 25,569 | 28 | 00:39:18 | 00:39:47 |
| refute | 5 | 5,265 | 199,077 | 18 | 00:39:49 | 00:40:07 |
| capture | 1 | 641 | 40,290 | 11 | 00:40:09 | 00:40:20 |
| synthesize | 1 | 9,312 | 36,548 | 50 | 00:40:22 | 00:41:11 |

- **claude-opus-5-5**: 3 agent · 24 calls · out 53,582 · in 50 · cache_read 1,644,260 · cache_create 309,810
- **claude-sonnet-5-5**: 9 agent · 22 calls · out 24,218 · in 44 · cache_read 326,515 · cache_create 281,754
- **claude-haiku-5-5**: 10 agent · 23 calls · out 16,498 · in 48 · cache_read 298,931 · cache_create 214,909

### S4 round 2 — wf_e8e5cab0-5ed (17 agent, 120,672 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:bash db/db-thu.sh oneinvest_ds1_do && cd | claude-haiku-5-5 | 73 | 29,577 | 146 | 3,476,893 | 4439 |
| review:conventions | claude-opus-5-5 | 12 | 19,920 | 26 | 875,169 | 199 |
| review:bugs | claude-opus-5-5 | 11 | 19,286 | 24 | 840,597 | 201 |
| review:measurement | claude-opus-5-5 | 5 | 18,601 | 12 | 211,717 | 185 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,736 | 4 | 35,051 | 38 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 4,926 | 4 | 25,169 | 27 |
| triage | claude-sonnet-5-5 | 2 | 3,747 | 4 | 25,004 | 26 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,895 | 4 | 23,044 | 46 |
| machine:bash db/db-thu.sh oneinvest_ds1 && cd pi | claude-haiku-5-5 | 4 | 2,604 | 8 | 70,953 | 72 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,441 | 4 | 23,042 | 73 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,361 | 4 | 23,048 | 230 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,142 | 4 | 23,062 | 13 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,607 | 4 | 23,056 | 9 |
| machine:node --test pipeline/scripts/dac-trung-s | claude-haiku-5-5 | 2 | 1,147 | 4 | 23,073 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,070 | 4 | 23,067 | 20 |
| machine:cd agent && node --import tsx --test tes | claude-haiku-5-5 | 2 | 960 | 4 | 23,072 | 8 |
| capture:provenance | claude-sonnet-5-5 | 3 | 652 | 6 | 40,574 | 10 |


wall: 4522s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,926 | 25,169 | 27 | 02:12:20 | 02:12:48 |
| machine | 10 | 46,804 | 3,732,310 | 4442 | 02:12:20 | 03:26:22 |
| review | 3 | 57,807 | 1,927,483 | 202 | 02:12:20 | 02:15:42 |
| triage | 1 | 3,747 | 25,004 | 26 | 03:26:24 | 03:26:51 |
| capture | 1 | 652 | 40,574 | 10 | 03:26:52 | 03:27:02 |
| synthesize | 1 | 6,736 | 35,051 | 38 | 03:27:04 | 03:27:42 |

- **claude-haiku-5-5**: 10 agent · 93 calls · out 46,804 · in 186 · cache_read 3,732,310 · cache_create 257,270
- **claude-opus-5-5**: 3 agent · 28 calls · out 57,807 · in 62 · cache_read 1,927,483 · cache_create 317,791
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 16,061 · in 18 · cache_read 125,798 · cache_create 133,071

