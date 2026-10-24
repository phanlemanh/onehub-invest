### S4 round 1 — wf_f62c4b51-3e9 (20 agent, 69,264 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 28 | 13,427 | 56 | 2,243,391 | 206 |
| review:bugs | claude-opus-5-5 | 21 | 12,100 | 42 | 1,348,347 | 174 |
| review:measurement | claude-opus-5-5 | 13 | 9,843 | 26 | 691,812 | 121 |
| synthesize:report | claude-sonnet-5-5 | 4 | 9,192 | 8 | 108,854 | 57 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,210 | 4 | 20,074 | 42 |
| refute:ops-nhan-ma-nguon.test.tsx | claude-sonnet-5-5 | 6 | 2,802 | 12 | 172,932 | 25 |
| refute:ops-visible-strings.mjs | claude-sonnet-5-5 | 7 | 2,363 | 14 | 135,217 | 25 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,125 | 4 | 19,978 | 19 |
| triage | claude-sonnet-5-5 | 2 | 2,038 | 4 | 19,981 | 16 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,879 | 4 | 19,992 | 8 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 1,810 | 4 | 16,915 | 18 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,782 | 4 | 19,974 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,410 | 4 | 19,997 | 12 |
| refute:ops-nhan-ma-nguon.test.tsx | claude-sonnet-5-5 | 3 | 1,066 | 6 | 47,864 | 10 |
| judge:E8:operational-feasibility | claude-sonnet-5-5 | 2 | 965 | 4 | 20,266 | 8 |
| judge:E8:domain-correctness | claude-sonnet-5-5 | 2 | 946 | 4 | 16,736 | 8 |
| machine:node --test scripts/*.test.mjs | claude-haiku-5-5 | 2 | 761 | 4 | 19,986 | 13 |
| judge:E8:spec-alignment | claude-sonnet-5-5 | 2 | 664 | 4 | 20,264 | 7 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 542 | 4 | 19,986 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 339 | 4 | 15,716 | 4 |


wall: 309s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,210 | 20,074 | 42 | 07:43:43 | 07:44:24 |
| machine | 7 | 10,309 | 136,828 | 69 | 07:43:43 | 07:44:52 |
| judge | 3 | 2,575 | 57,266 | 10 | 07:43:43 | 07:43:53 |
| review | 3 | 35,370 | 4,283,550 | 206 | 07:43:43 | 07:47:08 |
| triage | 1 | 2,038 | 19,981 | 16 | 07:47:08 | 07:47:24 |
| refute | 3 | 6,231 | 356,013 | 26 | 07:47:24 | 07:47:50 |
| capture | 1 | 339 | 15,716 | 4 | 07:47:50 | 07:47:55 |
| synthesize | 1 | 9,192 | 108,854 | 57 | 07:47:55 | 07:48:52 |

- **claude-opus-5-5**: 3 agent · 62 calls · out 35,370 · in 124 · cache_read 4,283,550 · cache_create 275,762
- **claude-sonnet-5-5**: 10 agent · 32 calls · out 23,585 · in 64 · cache_read 577,904 · cache_create 289,943
- **claude-haiku-5-5**: 7 agent · 14 calls · out 10,309 · in 28 · cache_read 136,828 · cache_create 145,693

