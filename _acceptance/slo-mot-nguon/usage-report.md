### S4 round 1 — wf_2952cedd-5a1 (17 agent, 58,873 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 21 | 12,355 | 42 | 1,501,352 | 147 |
| review:measurement | claude-opus-5-5 | 6 | 9,355 | 12 | 210,867 | 95 |
| synthesize:report | claude-sonnet-5-5 | 4 | 7,939 | 8 | 113,304 | 48 |
| review:bugs | claude-opus-5-5 | 11 | 7,612 | 22 | 522,705 | 90 |
| triage | claude-sonnet-5-5 | 2 | 3,473 | 4 | 20,673 | 25 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,289 | 4 | 18,707 | 23 |
| machine:node --test scripts/*.test.mjs | claude-haiku-5-5 | 2 | 2,041 | 4 | 19,518 | 20 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 1,953 | 4 | 19,510 | 13 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,629 | 4 | 19,506 | 9 |
| judge:E8:operational-feasibility | claude-sonnet-5-5 | 2 | 1,609 | 4 | 19,807 | 12 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,583 | 4 | 19,524 | 8 |
| judge:E8:domain-correctness | claude-sonnet-5-5 | 2 | 1,581 | 4 | 16,277 | 12 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,561 | 4 | 19,518 | 7 |
| judge:E8:spec-alignment | claude-sonnet-5-5 | 2 | 1,345 | 4 | 19,805 | 11 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 1,082 | 4 | 16,447 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,041 | 4 | 19,529 | 10 |
| capture:provenance | claude-sonnet-5-5 | 2 | 425 | 4 | 15,245 | 5 |


wall: 225s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,289 | 18,707 | 23 | 22:25:26 | 22:25:50 |
| machine | 7 | 10,890 | 133,552 | 55 | 22:25:26 | 22:26:22 |
| judge | 3 | 4,535 | 55,889 | 13 | 22:25:26 | 22:25:40 |
| review | 3 | 29,322 | 2,234,924 | 147 | 22:25:26 | 22:27:53 |
| triage | 1 | 3,473 | 20,673 | 25 | 22:27:53 | 22:28:19 |
| capture | 1 | 425 | 15,245 | 5 | 22:28:19 | 22:28:23 |
| synthesize | 1 | 7,939 | 113,304 | 48 | 22:28:23 | 22:29:11 |

- **claude-opus-5-5**: 3 agent · 38 calls · out 29,322 · in 76 · cache_read 2,234,924 · cache_create 241,180
- **claude-sonnet-5-5**: 7 agent · 16 calls · out 18,661 · in 32 · cache_read 223,818 · cache_create 194,707
- **claude-haiku-5-5**: 7 agent · 14 calls · out 10,890 · in 28 · cache_read 133,552 · cache_create 140,762

