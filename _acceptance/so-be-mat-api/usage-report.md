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

### S4 round 2 — wf_6aa89d6c-962 (21 agent, 44,121 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 3 | 7,057 | 6 | 71,356 | 45 |
| review:measurement | claude-opus-5-5 | 7 | 6,667 | 14 | 229,774 | 78 |
| review:bugs | claude-opus-5-5 | 7 | 4,523 | 14 | 189,165 | 57 |
| review:conventions | claude-opus-5-5 | 7 | 3,162 | 14 | 190,138 | 58 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,589 | 4 | 18,933 | 16 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,093 | 4 | 19,456 | 10 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,016 | 4 | 19,452 | 12 |
| triage | claude-sonnet-5-5 | 2 | 1,989 | 4 | 19,336 | 18 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,693 | 4 | 19,464 | 9 |
| refute:check-api-surface.mjs | claude-sonnet-5-5 | 3 | 1,429 | 6 | 40,006 | 15 |
| machine:node scripts/check-api-surface.mjs mutat | claude-haiku-5-5 | 2 | 1,399 | 4 | 19,472 | 8 |
| judge:E6:domain-correctness | claude-sonnet-5-5 | 3 | 1,342 | 8 | 44,519 | 14 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,319 | 4 | 19,475 | 12 |
| judge:E11:domain-correctness | claude-sonnet-5-5 | 3 | 1,028 | 6 | 42,686 | 13 |
| judge:E6:operational-feasibility | claude-sonnet-5-5 | 2 | 1,012 | 4 | 19,607 | 10 |
| judge:E6:spec-alignment | claude-sonnet-5-5 | 2 | 917 | 4 | 19,605 | 10 |
| judge:E11:operational-feasibility | claude-sonnet-5-5 | 3 | 913 | 6 | 42,475 | 12 |
| judge:E11:spec-alignment | claude-sonnet-5-5 | 3 | 911 | 6 | 42,330 | 12 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 887 | 4 | 19,450 | 8 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 674 | 4 | 16,413 | 7 |
| capture:provenance | claude-sonnet-5-5 | 2 | 501 | 4 | 15,195 | 6 |


wall: 167s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,589 | 18,933 | 16 | 11:53:26 | 11:53:42 |
| machine | 7 | 10,081 | 133,182 | 57 | 11:53:26 | 11:54:23 |
| judge | 6 | 6,123 | 211,222 | 15 | 11:53:26 | 11:53:41 |
| review | 3 | 14,352 | 609,077 | 83 | 11:53:26 | 11:54:49 |
| triage | 1 | 1,989 | 19,336 | 18 | 11:54:49 | 11:55:07 |
| refute | 1 | 1,429 | 40,006 | 15 | 11:55:07 | 11:55:22 |
| capture | 1 | 501 | 15,195 | 6 | 11:55:22 | 11:55:28 |
| synthesize | 1 | 7,057 | 71,356 | 45 | 11:55:28 | 11:56:13 |

- **claude-sonnet-5-5**: 11 agent · 28 calls · out 19,688 · in 58 · cache_read 376,048 · cache_create 293,790
- **claude-opus-5-5**: 3 agent · 21 calls · out 14,352 · in 42 · cache_read 609,077 · cache_create 138,215
- **claude-haiku-5-5**: 7 agent · 14 calls · out 10,081 · in 28 · cache_read 133,182 · cache_create 140,872

### S4 round 3 — wf_2d2a3d0b-766 (22 agent, 52,524 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 7 | 9,800 | 14 | 266,446 | 74 |
| review:conventions | claude-opus-5-5 | 11 | 6,529 | 22 | 459,133 | 88 |
| review:bugs | claude-opus-5-5 | 8 | 5,372 | 16 | 276,585 | 73 |
| review:measurement | claude-opus-5-5 | 5 | 4,768 | 10 | 116,582 | 58 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,213 | 4 | 19,600 | 19 |
| machine:BASE_URL=${BASE_URL:-http://localhost:34 | claude-haiku-5-5 | 2 | 2,333 | 4 | 19,586 | 31 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,237 | 4 | 19,534 | 11 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,217 | 4 | 19,540 | 15 |
| triage | claude-sonnet-5-5 | 2 | 1,858 | 4 | 18,680 | 17 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,581 | 4 | 19,548 | 9 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,555 | 4 | 19,554 | 10 |
| machine:node scripts/check-api-surface.mjs mutat | claude-haiku-5-5 | 2 | 1,554 | 4 | 19,556 | 8 |
| judge:E6:operational-feasibility | claude-sonnet-5-5 | 3 | 1,490 | 8 | 48,219 | 14 |
| machine:BASE_URL=${BASE_URL:-http://localhost:34 | claude-haiku-5-5 | 2 | 1,246 | 4 | 19,592 | 30 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,245 | 4 | 19,559 | 15 |
| judge:E6:spec-alignment | claude-sonnet-5-5 | 2 | 1,054 | 4 | 19,689 | 12 |
| judge:E6:domain-correctness | claude-sonnet-5-5 | 2 | 921 | 4 | 16,161 | 10 |
| judge:E11:spec-alignment | claude-sonnet-5-5 | 2 | 912 | 4 | 19,682 | 9 |
| judge:E11:domain-correctness | claude-sonnet-5-5 | 2 | 799 | 4 | 19,682 | 9 |
| judge:E11:operational-feasibility | claude-sonnet-5-5 | 2 | 743 | 4 | 19,684 | 8 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 723 | 4 | 16,479 | 9 |
| capture:provenance | claude-sonnet-5-5 | 2 | 374 | 4 | 15,279 | 5 |


wall: 183s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,213 | 19,600 | 19 | 15:17:23 | 15:17:42 |
| machine | 9 | 14,691 | 172,948 | 69 | 15:17:23 | 15:18:32 |
| judge | 6 | 5,919 | 143,117 | 16 | 15:17:23 | 15:17:39 |
| review | 3 | 16,669 | 852,300 | 88 | 15:17:23 | 15:18:51 |
| triage | 1 | 1,858 | 18,680 | 17 | 15:18:51 | 15:19:08 |
| capture | 1 | 374 | 15,279 | 5 | 15:19:08 | 15:19:13 |
| synthesize | 1 | 9,800 | 266,446 | 74 | 15:19:13 | 15:20:26 |

- **claude-sonnet-5-5**: 10 agent · 26 calls · out 21,164 · in 54 · cache_read 463,122 · cache_create 287,326
- **claude-opus-5-5**: 3 agent · 24 calls · out 16,669 · in 48 · cache_read 852,300 · cache_create 154,742
- **claude-haiku-5-5**: 9 agent · 18 calls · out 14,691 · in 36 · cache_read 172,948 · cache_create 180,930

