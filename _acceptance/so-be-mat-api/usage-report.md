### S4 round 1 — wf_cc2cdadc-8d6 (23 agent, 55,016 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 18 | 8,008 | 36 | 992,117 | 118 |
| review:measurement | claude-opus-5-5 | 8 | 7,460 | 16 | 326,761 | 98 |
| synthesize:report | claude-sonnet-5-5 | 5 | 6,988 | 10 | 153,093 | 46 |
| review:conventions | claude-opus-5-5 | 12 | 6,693 | 24 | 514,551 | 94 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 4,095 | 4 | 20,375 | 23 |
| triage | claude-sonnet-5-5 | 2 | 2,560 | 4 | 19,080 | 21 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,008 | 4 | 19,447 | 12 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,725 | 4 | 19,443 | 10 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,577 | 4 | 19,455 | 8 |
| refute:api-surface.ts | claude-sonnet-5-5 | 4 | 1,437 | 8 | 63,153 | 15 |
| machine:node scripts/check-api-surface.mjs mutat | claude-haiku-5-5 | 2 | 1,370 | 4 | 19,463 | 8 |
| judge:E6:operational-feasibility | claude-sonnet-5-5 | 2 | 1,286 | 4 | 19,598 | 13 |
| machine:BASE_URL=${BASE_URL:-http://localhost:34 | claude-haiku-5-5 | 2 | 1,283 | 4 | 19,492 | 8 |
| judge:E6:spec-alignment | claude-sonnet-5-5 | 2 | 1,214 | 4 | 19,596 | 12 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,205 | 4 | 19,466 | 14 |
| judge:E6:domain-correctness | claude-sonnet-5-5 | 2 | 967 | 4 | 19,596 | 10 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 907 | 4 | 19,461 | 8 |
| judge:E11:operational-feasibility | claude-sonnet-5-5 | 3 | 907 | 6 | 42,316 | 11 |
| judge:E11:domain-correctness | claude-sonnet-5-5 | 2 | 897 | 4 | 19,589 | 10 |
| machine:node scripts/check-smoke-guard.mjs | claude-haiku-5-5 | 2 | 720 | 4 | 19,461 | 7 |
| judge:E11:spec-alignment | claude-sonnet-5-5 | 3 | 715 | 6 | 43,020 | 10 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 568 | 4 | 19,441 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 426 | 4 | 15,186 | 5 |


wall: 209s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,095 | 20,375 | 23 | 11:44:53 | 11:45:16 |
| machine | 9 | 11,363 | 175,129 | 58 | 11:44:53 | 11:45:50 |
| judge | 6 | 5,986 | 163,715 | 15 | 11:44:53 | 11:45:07 |
| review | 3 | 22,161 | 1,833,429 | 122 | 11:44:53 | 11:46:55 |
| triage | 1 | 2,560 | 19,080 | 21 | 11:46:55 | 11:47:15 |
| refute | 1 | 1,437 | 63,153 | 15 | 11:47:15 | 11:47:30 |
| capture | 1 | 426 | 15,186 | 5 | 11:47:30 | 11:47:35 |
| synthesize | 1 | 6,988 | 153,093 | 46 | 11:47:35 | 11:48:21 |

- **claude-opus-5-5**: 3 agent · 38 calls · out 22,161 · in 76 · cache_read 1,833,429 · cache_create 193,302
- **claude-sonnet-5-5**: 11 agent · 29 calls · out 21,492 · in 58 · cache_read 434,602 · cache_create 290,440
- **claude-haiku-5-5**: 9 agent · 18 calls · out 11,363 · in 36 · cache_read 175,129 · cache_create 175,079

