### S4 round 1 — wf_7d2e5441-de8 (17 agent, 52,830 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 6 | 10,398 | 12 | 220,778 | 110 |
| review:conventions | claude-opus-5-5 | 15 | 8,110 | 30 | 576,176 | 101 |
| synthesize:report | claude-sonnet-5-5 | 4 | 7,183 | 8 | 112,303 | 52 |
| review:bugs | claude-opus-5-5 | 9 | 5,882 | 18 | 290,428 | 73 |
| triage | claude-sonnet-5-5 | 2 | 3,573 | 4 | 20,587 | 28 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,252 | 4 | 19,469 | 10 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,076 | 4 | 19,475 | 15 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 1,897 | 4 | 18,287 | 20 |
| machine:node --test scripts/*.test.mjs | claude-haiku-5-5 | 2 | 1,891 | 4 | 19,483 | 12 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,870 | 4 | 19,483 | 9 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,726 | 4 | 16,414 | 9 |
| judge:E7:domain-correctness | claude-sonnet-5-5 | 2 | 1,407 | 4 | 16,289 | 16 |
| judge:E7:operational-feasibility | claude-sonnet-5-5 | 2 | 1,286 | 4 | 16,291 | 15 |
| judge:E7:spec-alignment | claude-sonnet-5-5 | 2 | 1,145 | 4 | 16,289 | 23 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,121 | 4 | 19,494 | 11 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 591 | 4 | 19,489 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 422 | 4 | 15,210 | 8 |


wall: 200s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 1,897 | 18,287 | 20 | 12:13:22 | 12:13:42 |
| machine | 7 | 11,527 | 133,307 | 58 | 12:13:22 | 12:14:20 |
| judge | 3 | 3,838 | 48,869 | 28 | 12:13:22 | 12:13:49 |
| review | 3 | 24,390 | 1,087,382 | 111 | 12:13:22 | 12:15:13 |
| triage | 1 | 3,573 | 20,587 | 28 | 12:15:13 | 12:15:41 |
| capture | 1 | 422 | 15,210 | 8 | 12:15:41 | 12:15:50 |
| synthesize | 1 | 7,183 | 112,303 | 52 | 12:15:50 | 12:16:42 |

- **claude-opus-5-5**: 3 agent · 30 calls · out 24,390 · in 60 · cache_read 1,087,382 · cache_create 161,327
- **claude-sonnet-5-5**: 7 agent · 16 calls · out 16,913 · in 32 · cache_read 215,256 · cache_create 205,197
- **claude-haiku-5-5**: 7 agent · 14 calls · out 11,527 · in 28 · cache_read 133,307 · cache_create 140,013

