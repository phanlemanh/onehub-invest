### S4 round 1 — wf_f94d4a9b-7dc (19 agent, 63,231 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 7 | 10,277 | 18 | 376,494 | 104 |
| review:conventions | claude-opus-5-5 | 14 | 8,978 | 28 | 786,909 | 119 |
| synthesize:report | claude-sonnet-5-5 | 2 | 7,379 | 4 | 41,710 | 42 |
| review:bugs | claude-opus-5-5 | 8 | 7,161 | 18 | 330,324 | 78 |
| machine:cd app && npm test | claude-haiku-5-5 | 11 | 5,005 | 22 | 311,243 | 1216 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 10 | 4,146 | 20 | 256,615 | 1220 |
| triage | claude-sonnet-5-5 | 2 | 3,780 | 4 | 30,118 | 27 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,573 | 6 | 64,304 | 23 |
| refute:so-lenh.itest.mjs | claude-sonnet-5-5 | 5 | 1,817 | 10 | 148,441 | 16 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,641 | 4 | 28,313 | 7 |
| machine:cd pipeline && bash ../db/db-thu.sh onei | claude-haiku-5-5 | 2 | 1,400 | 4 | 28,375 | 32 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,371 | 4 | 28,324 | 42 |
| machine:cd app && bash ../db/db-thu.sh oneinvest | claude-haiku-5-5 | 2 | 1,317 | 4 | 28,362 | 32 |
| refute:so-lenh.test.tsx | claude-sonnet-5-5 | 4 | 1,229 | 8 | 93,358 | 11 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,088 | 4 | 28,319 | 6 |
| refute:so-lenh.test.tsx | claude-sonnet-5-5 | 3 | 1,002 | 6 | 56,788 | 9 |
| refute:so-lenh.test.tsx | claude-sonnet-5-5 | 4 | 1,002 | 8 | 93,523 | 10 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 731 | 4 | 25,112 | 66 |
| capture:provenance | claude-sonnet-5-5 | 2 | 334 | 4 | 23,909 | 4 |


wall: 2646s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,573 | 64,304 | 23 | 20:14:46 | 20:15:08 |
| machine | 8 | 16,699 | 734,663 | 2557 | 20:14:46 | 20:57:22 |
| review | 3 | 26,416 | 1,493,727 | 119 | 20:14:46 | 20:16:45 |
| triage | 1 | 3,780 | 30,118 | 27 | 20:57:22 | 20:57:49 |
| refute | 4 | 5,050 | 392,110 | 17 | 20:57:49 | 20:58:06 |
| capture | 1 | 334 | 23,909 | 4 | 20:58:06 | 20:58:10 |
| synthesize | 1 | 7,379 | 41,710 | 42 | 20:58:10 | 20:58:51 |

- **claude-opus-5-5**: 3 agent · 29 calls · out 26,416 · in 64 · cache_read 1,493,727 · cache_create 253,048
- **claude-sonnet-5-5**: 8 agent · 25 calls · out 20,116 · in 50 · cache_read 552,151 · cache_create 291,677
- **claude-haiku-5-5**: 8 agent · 33 calls · out 16,699 · in 66 · cache_read 734,663 · cache_create 280,028

### S4 round 2 — wf_4fd689bf-b82 (14 agent, 30,090 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 5 | 5,113 | 10 | 181,915 | 32 |
| review:measurement | claude-opus-5-5 | 7 | 4,127 | 18 | 274,781 | 43 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 9 | 4,067 | 18 | 216,056 | 1150 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,449 | 4 | 3,189 | 608 |
| review:bugs | claude-opus-5-5 | 9 | 2,433 | 18 | 448,982 | 28 |
| review:conventions | claude-opus-5-5 | 6 | 2,200 | 12 | 171,588 | 23 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,998 | 4 | 28,326 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,808 | 4 | 28,320 | 7 |
| machine:cd pipeline && bash ../db/db-thu.sh onei | claude-haiku-5-5 | 2 | 1,504 | 4 | 28,382 | 18 |
| machine:cd app && bash ../db/db-thu.sh oneinvest | claude-haiku-5-5 | 2 | 1,251 | 4 | 28,369 | 17 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,106 | 4 | 28,331 | 16 |
| triage | claude-sonnet-5-5 | 2 | 863 | 4 | 26,611 | 7 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 841 | 4 | 25,119 | 34 |
| capture:provenance | claude-sonnet-5-5 | 2 | 330 | 4 | 23,916 | 3 |


wall: 1865s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 8 | 15,024 | 386,092 | 1823 | 21:47:19 | 22:17:43 |
| review | 3 | 8,760 | 895,351 | 44 | 21:47:19 | 21:48:03 |
| triage | 1 | 863 | 26,611 | 7 | 22:17:43 | 22:17:50 |
| capture | 1 | 330 | 23,916 | 3 | 22:17:50 | 22:17:53 |
| synthesize | 1 | 5,113 | 181,915 | 32 | 22:17:53 | 22:18:25 |

- **claude-sonnet-5-5**: 3 agent · 9 calls · out 6,306 · in 18 · cache_read 232,442 · cache_create 111,798
- **claude-opus-5-5**: 3 agent · 22 calls · out 8,760 · in 48 · cache_read 895,351 · cache_create 172,874
- **claude-haiku-5-5**: 8 agent · 23 calls · out 15,024 · in 46 · cache_read 386,092 · cache_create 270,253

