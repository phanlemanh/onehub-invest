### S4 round 1 — wf_fc9c5dc3-c4d (21 agent, 82,078 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 31 | 16,919 | 62 | 3,177,845 | 206 |
| review:measurement | claude-opus-5-5 | 17 | 13,196 | 34 | 1,003,600 | 146 |
| review:bugs | claude-opus-5-5 | 21 | 11,074 | 42 | 1,778,540 | 136 |
| synthesize:report | claude-sonnet-5-5 | 3 | 9,958 | 6 | 73,831 | 56 |
| triage | claude-sonnet-5-5 | 2 | 3,169 | 4 | 22,074 | 22 |
| judge:E9:domain-correctness | claude-sonnet-5-5 | 3 | 2,902 | 6 | 48,434 | 28 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,443 | 4 | 19,474 | 27 |
| judge:E9:operational-feasibility | claude-sonnet-5-5 | 2 | 2,287 | 4 | 20,431 | 19 |
| judge:E9:spec-alignment | claude-sonnet-5-5 | 2 | 2,230 | 4 | 20,429 | 18 |
| refute:ops-nhan-theo-context.test.tsx | claude-sonnet-5-5 | 5 | 2,228 | 10 | 97,642 | 24 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,109 | 4 | 20,141 | 17 |
| refute:ops-nhan-theo-context.test.tsx | claude-sonnet-5-5 | 5 | 2,086 | 10 | 107,387 | 25 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,051 | 4 | 20,137 | 11 |
| refute:ops-nhan-theo-context.test.tsx | claude-sonnet-5-5 | 5 | 1,862 | 10 | 94,419 | 29 |
| refute:registry-table.tsx | claude-sonnet-5-5 | 6 | 1,722 | 12 | 106,814 | 21 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,698 | 4 | 20,149 | 8 |
| machine:node scripts/smoke-ops-nhan.mjs | claude-haiku-5-5 | 2 | 1,407 | 4 | 20,159 | 15 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,155 | 4 | 20,160 | 12 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 720 | 4 | 20,155 | 6 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 524 | 4 | 17,078 | 17 |
| capture:provenance | claude-sonnet-5-5 | 2 | 338 | 4 | 15,876 | 9 |


wall: 331s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,443 | 19,474 | 27 | 15:36:31 | 15:36:57 |
| machine | 7 | 9,664 | 137,979 | 83 | 15:36:31 | 15:37:54 |
| judge | 3 | 7,419 | 89,294 | 28 | 15:36:31 | 15:36:59 |
| review | 3 | 41,189 | 5,959,985 | 206 | 15:36:31 | 15:39:57 |
| triage | 1 | 3,169 | 22,074 | 22 | 15:39:59 | 15:40:21 |
| refute | 4 | 7,898 | 406,262 | 30 | 15:40:23 | 15:40:53 |
| capture | 1 | 338 | 15,876 | 9 | 15:40:55 | 15:41:04 |
| synthesize | 1 | 9,958 | 73,831 | 56 | 15:41:06 | 15:42:02 |

- **claude-opus-5-5**: 3 agent · 69 calls · out 41,189 · in 138 · cache_read 5,959,985 · cache_create 352,783
- **claude-sonnet-5-5**: 11 agent · 37 calls · out 31,225 · in 74 · cache_read 626,811 · cache_create 317,151
- **claude-haiku-5-5**: 7 agent · 14 calls · out 9,664 · in 28 · cache_read 137,979 · cache_create 131,241

