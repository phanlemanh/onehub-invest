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

