### S4 round 1 — wf_ef4c80d5-104 (17 agent, 71,847 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| ui:E9 | claude-sonnet-5-5 | 38 | 18,722 | 76 | 3,690,154 | 294 |
| synthesize:report | claude-sonnet-5-5 | 4 | 12,016 | 8 | 113,359 | 74 |
| review:bugs | claude-opus-5-5 | 12 | 5,584 | 24 | 520,197 | 130 |
| review:measurement | claude-opus-5-5 | 6 | 5,576 | 12 | 190,507 | 74 |
| review:conventions | claude-opus-5-5 | 7 | 5,352 | 14 | 265,579 | 73 |
| judge:E7:spec-alignment | claude-sonnet-5-5 | 2 | 3,933 | 4 | 20,856 | 28 |
| judge:E7:operational-feasibility | claude-sonnet-5-5 | 2 | 3,639 | 4 | 20,858 | 26 |
| judge:E7:domain-correctness | claude-sonnet-5-5 | 3 | 3,600 | 6 | 63,428 | 26 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,689 | 4 | 19,597 | 40 |
| triage | claude-sonnet-5-5 | 2 | 2,495 | 4 | 19,986 | 19 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,143 | 4 | 20,038 | 17 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,702 | 4 | 20,023 | 8 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,567 | 4 | 20,052 | 7 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,008 | 4 | 20,034 | 12 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 760 | 4 | 16,952 | 27 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 709 | 4 | 20,011 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 352 | 4 | 15,788 | 5 |


wall: 397s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,689 | 19,597 | 40 | 00:37:53 | 00:38:34 |
| machine | 6 | 7,889 | 117,110 | 87 | 00:37:53 | 00:39:20 |
| ui | 1 | 18,722 | 3,690,154 | 294 | 00:37:53 | 00:42:47 |
| judge | 3 | 11,172 | 105,142 | 29 | 00:37:53 | 00:38:23 |
| review | 3 | 16,512 | 976,283 | 135 | 00:37:54 | 00:40:08 |
| triage | 1 | 2,495 | 19,986 | 19 | 00:42:49 | 00:43:08 |
| capture | 1 | 352 | 15,788 | 5 | 00:43:10 | 00:43:15 |
| synthesize | 1 | 12,016 | 113,359 | 74 | 00:43:16 | 00:44:30 |

- **claude-sonnet-5-5**: 8 agent · 55 calls · out 47,446 · in 110 · cache_read 3,964,026 · cache_create 381,691
- **claude-opus-5-5**: 3 agent · 25 calls · out 16,512 · in 50 · cache_read 976,283 · cache_create 181,798
- **claude-haiku-5-5**: 6 agent · 12 calls · out 7,889 · in 24 · cache_read 117,110 · cache_create 112,846

