### S4 round 1 — wf_9dfa121f-ab9 (17 agent, 30,861 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 2 | 5,543 | 4 | 26,630 | 35 |
| review:conventions | claude-opus-5-5 | 10 | 3,988 | 20 | 335,693 | 44 |
| review:bugs | claude-opus-5-5 | 8 | 3,750 | 16 | 234,356 | 42 |
| review:measurement | claude-opus-5-5 | 3 | 2,655 | 6 | 50,285 | 28 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,218 | 4 | 20,321 | 14 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,803 | 4 | 17,816 | 9 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,781 | 4 | 20,891 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,602 | 4 | 20,885 | 8 |
| triage | claude-sonnet-5-5 | 2 | 1,470 | 4 | 19,657 | 21 |
| judge:E6:spec-alignment | claude-sonnet-5-5 | 3 | 1,039 | 6 | 48,969 | 20 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,036 | 4 | 20,896 | 14 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 979 | 4 | 20,877 | 22 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 781 | 4 | 20,871 | 30 |
| judge:E6:domain-correctness | claude-sonnet-5-5 | 2 | 606 | 4 | 17,577 | 9 |
| judge:E6:operational-feasibility | claude-sonnet-5-5 | 2 | 591 | 4 | 21,107 | 13 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 569 | 4 | 20,903 | 7 |
| capture:provenance | claude-sonnet-5-5 | 2 | 450 | 4 | 16,623 | 6 |


wall: 154s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,218 | 20,321 | 14 | 23:17:57 | 23:18:11 |
| machine | 7 | 8,551 | 143,139 | 91 | 23:17:57 | 23:19:28 |
| judge | 3 | 2,236 | 87,653 | 21 | 23:17:57 | 23:18:18 |
| review | 3 | 10,393 | 620,334 | 44 | 23:17:57 | 23:18:41 |
| triage | 1 | 1,470 | 19,657 | 21 | 23:19:28 | 23:19:49 |
| capture | 1 | 450 | 16,623 | 6 | 23:19:49 | 23:19:55 |
| synthesize | 1 | 5,543 | 26,630 | 35 | 23:19:55 | 23:20:31 |

- **claude-sonnet-5-5**: 7 agent · 15 calls · out 11,917 · in 30 · cache_read 170,884 · cache_create 185,826
- **claude-opus-5-5**: 3 agent · 21 calls · out 10,393 · in 42 · cache_read 620,334 · cache_create 128,881
- **claude-haiku-5-5**: 7 agent · 14 calls · out 8,551 · in 28 · cache_read 143,139 · cache_create 136,489

