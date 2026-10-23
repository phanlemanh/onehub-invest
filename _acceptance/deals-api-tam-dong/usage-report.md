### S4 round 1 — wf_c3f02b3d-691 (18 agent, 40,535 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 2 | 6,290 | 4 | 29,733 | 37 |
| review:bugs | claude-opus-5-5 | 12 | 5,142 | 24 | 444,233 | 75 |
| review:conventions | claude-opus-5-5 | 11 | 4,631 | 22 | 382,568 | 68 |
| review:measurement | claude-opus-5-5 | 4 | 4,158 | 8 | 73,216 | 48 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,547 | 4 | 23,037 | 22 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,533 | 4 | 19,438 | 12 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,083 | 4 | 19,444 | 10 |
| triage | claude-sonnet-5-5 | 2 | 2,029 | 4 | 18,918 | 17 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,842 | 4 | 19,440 | 10 |
| judge:E11:domain-correctness | claude-sonnet-5-5 | 3 | 1,268 | 6 | 49,464 | 14 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,256 | 4 | 19,463 | 13 |
| judge:E11:operational-feasibility | claude-sonnet-5-5 | 3 | 1,255 | 6 | 49,365 | 14 |
| judge:E11:spec-alignment | claude-sonnet-5-5 | 2 | 1,109 | 4 | 19,671 | 11 |
| machine:node scripts/check-deals-api.mjs mutatio | claude-haiku-5-5 | 2 | 981 | 4 | 19,461 | 7 |
| machine:BASE_URL=${BASE_URL:-http://localhost:34 | claude-haiku-5-5 | 2 | 779 | 4 | 19,489 | 6 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 651 | 4 | 19,458 | 5 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 566 | 4 | 19,452 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 415 | 4 | 18,097 | 6 |


wall: 138s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,547 | 23,037 | 22 | 09:55:21 | 09:55:43 |
| machine | 8 | 10,691 | 155,645 | 56 | 09:55:21 | 09:56:17 |
| judge | 3 | 3,632 | 118,500 | 17 | 09:55:21 | 09:55:38 |
| review | 3 | 13,931 | 900,017 | 78 | 09:55:21 | 09:56:39 |
| triage | 1 | 2,029 | 18,918 | 17 | 09:56:39 | 09:56:57 |
| capture | 1 | 415 | 18,097 | 6 | 09:56:57 | 09:57:03 |
| synthesize | 1 | 6,290 | 29,733 | 37 | 09:57:03 | 09:57:40 |

- **claude-sonnet-5-5**: 7 agent · 16 calls · out 15,913 · in 32 · cache_read 208,285 · cache_create 186,933
- **claude-opus-5-5**: 3 agent · 27 calls · out 13,931 · in 54 · cache_read 900,017 · cache_create 129,985
- **claude-haiku-5-5**: 8 agent · 16 calls · out 10,691 · in 32 · cache_read 155,645 · cache_create 155,759

