### S4 round 1 — wf_2190489f-6fc (17 agent, 56,220 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 10 | 10,610 | 20 | 395,565 | 131 |
| review:bugs | claude-opus-5-5 | 15 | 9,344 | 30 | 596,498 | 111 |
| synthesize:report | claude-sonnet-5-5 | 3 | 7,975 | 6 | 70,275 | 47 |
| review:conventions | claude-opus-5-5 | 12 | 7,415 | 24 | 470,435 | 91 |
| triage | claude-sonnet-5-5 | 2 | 3,513 | 4 | 20,645 | 27 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,005 | 4 | 19,495 | 10 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 1,896 | 4 | 18,307 | 14 |
| judge:E9:operational-feasibility | claude-sonnet-5-5 | 2 | 1,847 | 4 | 19,884 | 16 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,740 | 4 | 16,434 | 13 |
| machine:node --test scripts/*.test.mjs | claude-haiku-5-5 | 2 | 1,708 | 4 | 19,503 | 13 |
| judge:E9:domain-correctness | claude-sonnet-5-5 | 2 | 1,676 | 4 | 16,354 | 15 |
| judge:E9:spec-alignment | claude-sonnet-5-5 | 2 | 1,639 | 4 | 19,882 | 15 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,553 | 4 | 19,509 | 10 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,209 | 4 | 19,514 | 12 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 970 | 4 | 19,503 | 8 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 796 | 4 | 19,489 | 7 |
| capture:provenance | claude-sonnet-5-5 | 2 | 324 | 4 | 15,230 | 5 |


wall: 212s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 1,896 | 18,307 | 14 | 11:26:29 | 11:26:43 |
| machine | 7 | 9,981 | 133,447 | 60 | 11:26:29 | 11:27:29 |
| judge | 3 | 5,162 | 56,120 | 17 | 11:26:29 | 11:26:45 |
| review | 3 | 27,369 | 1,462,498 | 133 | 11:26:29 | 11:28:42 |
| triage | 1 | 3,513 | 20,645 | 27 | 11:28:42 | 11:29:09 |
| capture | 1 | 324 | 15,230 | 5 | 11:29:09 | 11:29:14 |
| synthesize | 1 | 7,975 | 70,275 | 47 | 11:29:14 | 11:30:01 |

- **claude-opus-5-5**: 3 agent · 37 calls · out 27,369 · in 74 · cache_read 1,462,498 · cache_create 188,033
- **claude-sonnet-5-5**: 7 agent · 15 calls · out 18,870 · in 30 · cache_read 180,577 · cache_create 202,955
- **claude-haiku-5-5**: 7 agent · 14 calls · out 9,981 · in 28 · cache_read 133,447 · cache_create 140,183

