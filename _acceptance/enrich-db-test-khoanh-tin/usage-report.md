### S4 round 1 — wf_d392816e-cfd (20 agent, 47,564 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 3 | 7,652 | 6 | 70,590 | 45 |
| review:measurement | claude-opus-5-5 | 4 | 5,250 | 8 | 80,515 | 64 |
| review:conventions | claude-opus-5-5 | 7 | 5,022 | 14 | 166,661 | 71 |
| review:bugs | claude-opus-5-5 | 6 | 4,981 | 12 | 135,717 | 64 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,454 | 4 | 20,736 | 19 |
| triage | claude-sonnet-5-5 | 2 | 2,976 | 4 | 25,783 | 22 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,493 | 4 | 20,183 | 33 |
| refute:enrich-db.test.ts | claude-sonnet-5-5 | 4 | 2,118 | 8 | 69,866 | 19 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,893 | 4 | 20,203 | 8 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,804 | 4 | 20,185 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,684 | 4 | 20,197 | 8 |
| refute:pham-vi.sh | claude-sonnet-5-5 | 4 | 1,562 | 8 | 60,044 | 15 |
| refute:pham-vi.sh | claude-sonnet-5-5 | 3 | 1,102 | 6 | 38,606 | 11 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 980 | 4 | 20,189 | 15 |
| machine:bash _acceptance/enrich-db-test-khoanh-t | claude-haiku-5-5 | 2 | 951 | 4 | 20,226 | 9 |
| machine:bash _acceptance/enrich-db-test-khoanh-t | claude-haiku-5-5 | 2 | 922 | 4 | 20,226 | 6 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 921 | 4 | 20,208 | 12 |
| refute:pham-vi.sh | claude-sonnet-5-5 | 3 | 785 | 6 | 35,418 | 8 |
| machine:bash _acceptance/enrich-db-test-khoanh-t | claude-haiku-5-5 | 2 | 669 | 4 | 20,226 | 9 |
| capture:provenance | claude-sonnet-5-5 | 2 | 345 | 4 | 15,926 | 5 |


wall: 178s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,454 | 20,736 | 19 | 02:35:31 | 02:35:50 |
| machine | 9 | 12,317 | 181,843 | 86 | 02:35:31 | 02:36:57 |
| review | 3 | 15,253 | 382,893 | 71 | 02:35:31 | 02:36:42 |
| triage | 1 | 2,976 | 25,783 | 22 | 02:36:57 | 02:37:18 |
| refute | 4 | 5,567 | 203,934 | 20 | 02:37:18 | 02:37:39 |
| capture | 1 | 345 | 15,926 | 5 | 02:37:39 | 02:37:43 |
| synthesize | 1 | 7,652 | 70,590 | 45 | 02:37:43 | 02:38:28 |

- **claude-sonnet-5-5**: 8 agent · 23 calls · out 19,994 · in 46 · cache_read 336,969 · cache_create 185,464
- **claude-opus-5-5**: 3 agent · 17 calls · out 15,253 · in 34 · cache_read 382,893 · cache_create 105,488
- **claude-haiku-5-5**: 9 agent · 18 calls · out 12,317 · in 36 · cache_read 181,843 · cache_create 162,649

### S4 round 2 — wf_f44399ee-7f8 (18 agent, 48,250 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 7 | 7,592 | 14 | 205,281 | 90 |
| synthesize:report | claude-sonnet-5-5 | 3 | 6,545 | 6 | 67,156 | 41 |
| review:bugs | claude-opus-5-5 | 8 | 6,184 | 16 | 267,883 | 74 |
| review:conventions | claude-opus-5-5 | 7 | 4,876 | 14 | 160,839 | 62 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,578 | 4 | 23,992 | 20 |
| triage | claude-sonnet-5-5 | 2 | 3,155 | 4 | 21,708 | 23 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,510 | 4 | 20,249 | 30 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,214 | 4 | 20,255 | 18 |
| refute:enrich-db.test.ts | claude-sonnet-5-5 | 2 | 1,947 | 4 | 19,238 | 17 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,846 | 4 | 20,269 | 10 |
| refute:enrich-db.test.ts | claude-sonnet-5-5 | 4 | 1,669 | 8 | 65,815 | 17 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,539 | 4 | 20,263 | 7 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,004 | 4 | 20,274 | 12 |
| machine:bash _acceptance/enrich-db-test-khoanh-t | claude-haiku-5-5 | 2 | 963 | 4 | 20,292 | 5 |
| machine:bash _acceptance/enrich-db-test-khoanh-t | claude-haiku-5-5 | 2 | 926 | 4 | 20,292 | 9 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 710 | 4 | 20,251 | 7 |
| machine:bash _acceptance/enrich-db-test-khoanh-t | claude-haiku-5-5 | 2 | 561 | 4 | 20,292 | 9 |
| capture:provenance | claude-sonnet-5-5 | 2 | 431 | 4 | 15,992 | 6 |


wall: 178s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,578 | 23,992 | 20 | 02:40:43 | 02:41:03 |
| machine | 9 | 12,273 | 182,437 | 84 | 02:40:43 | 02:42:07 |
| review | 3 | 18,652 | 634,003 | 90 | 02:40:43 | 02:42:12 |
| triage | 1 | 3,155 | 21,708 | 23 | 02:42:12 | 02:42:35 |
| refute | 2 | 3,616 | 85,053 | 19 | 02:42:35 | 02:42:54 |
| capture | 1 | 431 | 15,992 | 6 | 02:42:54 | 02:42:59 |
| synthesize | 1 | 6,545 | 67,156 | 41 | 02:42:59 | 02:43:41 |

- **claude-opus-5-5**: 3 agent · 22 calls · out 18,652 · in 44 · cache_read 634,003 · cache_create 129,036
- **claude-sonnet-5-5**: 6 agent · 15 calls · out 17,325 · in 30 · cache_read 213,901 · cache_create 154,818
- **claude-haiku-5-5**: 9 agent · 18 calls · out 12,273 · in 36 · cache_read 182,437 · cache_create 163,448

### S4 round 3 — wf_86cd9d9f-7f1 (16 agent, 34,043 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 4 | 6,202 | 8 | 115,608 | 42 |
| review:measurement | claude-opus-5-5 | 6 | 5,149 | 12 | 165,679 | 61 |
| review:bugs | claude-opus-5-5 | 6 | 4,509 | 12 | 142,781 | 59 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,562 | 4 | 24,018 | 24 |
| review:conventions | claude-opus-5-5 | 7 | 2,859 | 14 | 171,736 | 40 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,135 | 4 | 20,281 | 31 |
| triage | claude-sonnet-5-5 | 2 | 1,933 | 4 | 20,040 | 15 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,783 | 4 | 20,289 | 10 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,066 | 4 | 20,300 | 14 |
| machine:bash _acceptance/enrich-db-test-khoanh-t | claude-haiku-5-5 | 2 | 985 | 4 | 20,318 | 5 |
| machine:bash _acceptance/enrich-db-test-khoanh-t | claude-haiku-5-5 | 2 | 789 | 4 | 20,318 | 9 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 719 | 4 | 20,275 | 42 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 660 | 4 | 20,277 | 8 |
| machine:bash _acceptance/enrich-db-test-khoanh-t | claude-haiku-5-5 | 2 | 651 | 4 | 20,318 | 11 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 636 | 4 | 20,295 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 405 | 4 | 16,018 | 5 |


wall: 172s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,562 | 24,018 | 24 | 02:46:22 | 02:46:46 |
| machine | 9 | 9,424 | 182,671 | 110 | 02:46:22 | 02:48:12 |
| review | 3 | 12,517 | 480,196 | 61 | 02:46:22 | 02:47:24 |
| triage | 1 | 1,933 | 20,040 | 15 | 02:48:12 | 02:48:28 |
| capture | 1 | 405 | 16,018 | 5 | 02:48:28 | 02:48:33 |
| synthesize | 1 | 6,202 | 115,608 | 42 | 02:48:33 | 02:49:15 |

- **claude-sonnet-5-5**: 4 agent · 10 calls · out 12,102 · in 20 · cache_read 175,684 · cache_create 121,590
- **claude-opus-5-5**: 3 agent · 19 calls · out 12,517 · in 38 · cache_read 480,196 · cache_create 116,884
- **claude-haiku-5-5**: 9 agent · 18 calls · out 9,424 · in 36 · cache_read 182,671 · cache_create 163,811

