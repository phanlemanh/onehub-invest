### S4 round 1 — wf_4d9d3167-b83 (30 agent, 111,847 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 6 | 22,602 | 12 | 353,978 | 218 |
| review:bugs | claude-opus-5-5 | 8 | 18,784 | 18 | 665,214 | 248 |
| review:conventions | claude-opus-5-5 | 7 | 14,358 | 16 | 435,932 | 150 |
| synthesize:report | claude-sonnet-5-5 | 2 | 11,603 | 4 | 40,642 | 59 |
| triage | claude-sonnet-5-5 | 3 | 9,030 | 6 | 65,311 | 54 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 6,414 | 6 | 65,605 | 56 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,448 | 4 | 3,140 | 363 |
| machine:bash db/db-thu.sh oneinvest_p1_n1 && cd | claude-haiku-5-5 | 2 | 2,319 | 4 | 25,140 | 118 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,996 | 4 | 24,976 | 8 |
| machine:bash db/db-thu.sh oneinvest_n1_kta && cd | claude-haiku-5-5 | 2 | 1,696 | 4 | 25,063 | 10 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,681 | 4 | 24,970 | 7 |
| refute:khu-trung-anh.test.tsx | claude-sonnet-5-5 | 4 | 1,521 | 8 | 83,749 | 19 |
| refute:khu-trung-anh.itest.mjs | claude-sonnet-5-5 | 4 | 1,419 | 8 | 89,870 | 18 |
| refute:review-media.ts | claude-sonnet-5-5 | 5 | 1,414 | 12 | 117,207 | 22 |
| machine:bash db/db-thu.sh oneinvest_n1_kta && cd | claude-haiku-5-5 | 2 | 1,294 | 4 | 25,062 | 73 |
| machine:node --test pipeline/scripts/khu-trung-a | claude-haiku-5-5 | 2 | 1,182 | 4 | 24,987 | 7 |
| refute:transform-media.mjs | claude-sonnet-5-5 | 3 | 1,094 | 6 | 49,252 | 16 |
| machine:cd pipeline && DATABASE_URL=postgres://o | claude-haiku-5-5 | 2 | 1,062 | 4 | 25,026 | 15 |
| refute:khu-trung-anh.test.tsx | claude-sonnet-5-5 | 3 | 1,024 | 6 | 54,794 | 16 |
| refute:khu-trung-anh.itest.mjs | claude-sonnet-5-5 | 2 | 1,012 | 4 | 23,684 | 13 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 973 | 4 | 24,985 | 7 |
| refute:khu-trung-anh.test.mjs | claude-sonnet-5-5 | 2 | 967 | 4 | 23,537 | 16 |
| refute:khu-trung-anh.itest.mjs | claude-sonnet-5-5 | 2 | 951 | 4 | 23,687 | 13 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 919 | 4 | 24,981 | 16 |
| refute:evals.yaml | claude-sonnet-5-5 | 3 | 889 | 6 | 49,144 | 12 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 856 | 4 | 24,958 | 68 |
| refute:khu-trung-anh.test.mjs | claude-sonnet-5-5 | 3 | 754 | 6 | 58,211 | 15 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 667 | 4 | 24,962 | 286 |
| refute:khu-trung-anh.test.tsx | claude-sonnet-5-5 | 2 | 569 | 4 | 23,598 | 11 |
| capture:provenance | claude-sonnet-5-5 | 2 | 349 | 4 | 20,621 | 7 |


wall: 909s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 6,414 | 65,605 | 56 | 10:15:20 | 10:16:16 |
| machine | 12 | 17,093 | 278,250 | 758 | 10:15:20 | 10:27:58 |
| review | 3 | 55,744 | 1,455,124 | 249 | 10:15:20 | 10:19:28 |
| triage | 1 | 9,030 | 65,311 | 54 | 10:28:00 | 10:28:54 |
| refute | 11 | 11,614 | 596,733 | 23 | 10:28:56 | 10:29:19 |
| capture | 1 | 349 | 20,621 | 7 | 10:29:21 | 10:29:28 |
| synthesize | 1 | 11,603 | 40,642 | 59 | 10:29:30 | 10:30:29 |

- **claude-opus-5-5**: 3 agent · 21 calls · out 55,744 · in 46 · cache_read 1,455,124 · cache_create 344,110
- **claude-sonnet-5-5**: 15 agent · 43 calls · out 39,010 · in 88 · cache_read 788,912 · cache_create 481,885
- **claude-haiku-5-5**: 12 agent · 24 calls · out 17,093 · in 48 · cache_read 278,250 · cache_create 296,465

### S4 round 2 — wf_3de45251-e02 (25 agent, 88,744 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 8 | 18,828 | 16 | 534,157 | 225 |
| review:measurement | claude-opus-5-5 | 5 | 17,285 | 12 | 232,102 | 171 |
| review:conventions | claude-opus-5-5 | 5 | 10,653 | 10 | 186,495 | 111 |
| synthesize:report | claude-sonnet-5-5 | 2 | 8,682 | 4 | 34,996 | 53 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 6,531 | 6 | 65,972 | 60 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 3,016 | 4 | 21,855 | 52 |
| machine:bash db/db-thu.sh oneinvest_p1_n1 && cd | claude-haiku-5-5 | 2 | 2,270 | 4 | 25,177 | 157 |
| machine:bash db/db-thu.sh oneinvest_n1_kta --neu | claude-haiku-5-5 | 2 | 2,017 | 4 | 25,139 | 14 |
| triage | claude-sonnet-5-5 | 2 | 1,928 | 4 | 25,523 | 17 |
| machine:node --test pipeline/scripts/khu-trung-a | claude-haiku-5-5 | 3 | 1,699 | 8 | 50,645 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,609 | 4 | 25,007 | 7 |
| refute:khu-trung-anh.test.mjs | claude-sonnet-5-5 | 4 | 1,256 | 8 | 75,339 | 22 |
| refute:khu-trung-anh.test.mjs | claude-sonnet-5-5 | 2 | 1,232 | 4 | 23,823 | 14 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 4 | 1,196 | 8 | 54,607 | 613 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,168 | 4 | 25,013 | 6 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 1,165 | 4 | 25,022 | 7 |
| machine:bash db/db-thu.sh oneinvest_n1_kta --neu | claude-haiku-5-5 | 2 | 1,158 | 4 | 25,107 | 34 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,107 | 4 | 25,018 | 17 |
| refute:khu-trung-anh.test.mjs | claude-sonnet-5-5 | 3 | 1,105 | 6 | 55,848 | 19 |
| refute:do-khu-trung-anh.mjs | claude-sonnet-5-5 | 2 | 1,095 | 4 | 23,723 | 12 |
| machine:cd pipeline && DATABASE_URL=postgres://o | claude-haiku-5-5 | 2 | 1,062 | 4 | 25,063 | 17 |
| refute:khu-trung-anh.test.tsx | claude-sonnet-5-5 | 3 | 945 | 6 | 53,184 | 16 |
| refute:evals.yaml | claude-sonnet-5-5 | 3 | 805 | 6 | 46,665 | 12 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 586 | 4 | 6,280 | 385 |
| capture:provenance | claude-sonnet-5-5 | 2 | 346 | 4 | 20,658 | 17 |


wall: 1219s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 6,531 | 65,972 | 60 | 10:34:48 | 10:35:48 |
| machine | 12 | 18,053 | 333,933 | 1100 | 10:34:48 | 10:53:07 |
| review | 3 | 46,766 | 952,754 | 226 | 10:34:48 | 10:38:34 |
| triage | 1 | 1,928 | 25,523 | 17 | 10:53:09 | 10:53:26 |
| refute | 6 | 6,438 | 278,582 | 24 | 10:53:28 | 10:53:53 |
| capture | 1 | 346 | 20,658 | 17 | 10:53:55 | 10:54:11 |
| synthesize | 1 | 8,682 | 34,996 | 53 | 10:54:13 | 10:55:07 |

- **claude-opus-5-5**: 3 agent · 18 calls · out 46,766 · in 38 · cache_read 952,754 · cache_create 292,351
- **claude-sonnet-5-5**: 10 agent · 26 calls · out 23,925 · in 52 · cache_read 425,731 · cache_create 303,095
- **claude-haiku-5-5**: 12 agent · 27 calls · out 18,053 · in 56 · cache_read 333,933 · cache_create 322,655

