### S4 vòng 1 — wf_8f92e5f3-a5a (16 agent, 45,461 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 13 | 9,269 | 26 | 625,648 | 133 |
| review:measurement | claude-opus-5-5 | 8 | 6,040 | 16 | 272,093 | 73 |
| synthesize:report | claude-sonnet-5-5 | 3 | 5,584 | 6 | 63,552 | 32 |
| review:conventions | claude-opus-5-5 | 6 | 3,972 | 12 | 161,711 | 47 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,831 | 4 | 16,947 | 24 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,441 | 4 | 19,341 | 29 |
| machine:node scripts/smoke-ops-mobile.mjs | claude-haiku-5-5 | 2 | 2,277 | 4 | 20,028 | 34 |
| triage | claude-sonnet-5-5 | 2 | 2,154 | 4 | 20,370 | 17 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 1,932 | 4 | 20,010 | 17 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,916 | 4 | 20,024 | 10 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,782 | 4 | 20,025 | 11 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,616 | 4 | 20,018 | 9 |
| refute:smoke-ops-mobile.mjs | claude-sonnet-5-5 | 4 | 1,352 | 8 | 58,679 | 16 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,086 | 4 | 20,029 | 22 |
| refute:smoke-ops-mobile.mjs | claude-sonnet-5-5 | 3 | 883 | 6 | 37,737 | 11 |
| capture:provenance | claude-sonnet-5-5 | 2 | 326 | 4 | 15,745 | 5 |


wall: 214s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,441 | 19,341 | 29 | 23:14:39 | 23:15:08 |
| machine | 7 | 13,440 | 137,081 | 103 | 23:14:40 | 23:16:22 |
| review | 3 | 19,281 | 1,059,452 | 134 | 23:14:40 | 23:16:54 |
| triage | 1 | 2,154 | 20,370 | 17 | 23:16:56 | 23:17:13 |
| refute | 2 | 2,235 | 96,416 | 17 | 23:17:15 | 23:17:32 |
| capture | 1 | 326 | 15,745 | 5 | 23:17:34 | 23:17:39 |
| synthesize | 1 | 5,584 | 63,552 | 32 | 23:17:41 | 23:18:13 |

- **claude-opus-5-5**: 3 agent · 27 calls · out 19,281 · in 54 · cache_read 1,059,452 · cache_create 172,178
- **claude-sonnet-5-5**: 6 agent · 16 calls · out 12,740 · in 32 · cache_read 215,424 · cache_create 150,097
- **claude-haiku-5-5**: 7 agent · 14 calls · out 13,440 · in 28 · cache_read 137,081 · cache_create 130,988


### S4 vòng 2 — wf_60f39d0c-da0 (13 agent, 26,104 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 4 | 4,868 | 8 | 104,335 | 33 |
| review:measurement | claude-opus-5-5 | 4 | 4,774 | 8 | 100,159 | 54 |
| review:bugs | claude-opus-5-5 | 5 | 4,635 | 10 | 134,400 | 52 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,846 | 4 | 20,030 | 23 |
| review:conventions | claude-opus-5-5 | 5 | 2,263 | 10 | 131,820 | 29 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,658 | 4 | 20,044 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,238 | 4 | 20,074 | 14 |
| triage | claude-sonnet-5-5 | 2 | 910 | 4 | 18,369 | 8 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 683 | 4 | 20,050 | 6 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 651 | 4 | 20,032 | 7 |
| machine:node scripts/smoke-ops-mobile.mjs | claude-haiku-5-5 | 2 | 645 | 4 | 20,054 | 21 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 528 | 4 | 20,036 | 13 |
| capture:provenance | claude-sonnet-5-5 | 2 | 405 | 4 | 15,771 | 6 |


wall: 136s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 7 | 8,249 | 140,320 | 83 | 23:21:19 | 23:22:42 |
| review | 3 | 11,672 | 366,379 | 54 | 23:21:19 | 23:22:12 |
| triage | 1 | 910 | 18,369 | 8 | 23:22:44 | 23:22:52 |
| capture | 1 | 405 | 15,771 | 6 | 23:22:55 | 23:23:00 |
| synthesize | 1 | 4,868 | 104,335 | 33 | 23:23:02 | 23:23:35 |

- **claude-sonnet-5-5**: 3 agent · 8 calls · out 6,183 · in 16 · cache_read 138,475 · cache_create 86,831
- **claude-opus-5-5**: 3 agent · 14 calls · out 11,672 · in 28 · cache_read 366,379 · cache_create 132,704
- **claude-haiku-5-5**: 7 agent · 14 calls · out 8,249 · in 28 · cache_read 140,320 · cache_create 128,462

