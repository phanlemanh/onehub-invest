### S4 round 1 — wf_d2a45290-85a (17 agent, 48,443 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 5 | 8,732 | 10 | 159,499 | 64 |
| review:measurement | claude-opus-5-5 | 5 | 7,793 | 10 | 142,781 | 82 |
| review:bugs | claude-opus-5-5 | 9 | 6,907 | 18 | 319,058 | 87 |
| review:conventions | claude-opus-5-5 | 7 | 5,048 | 14 | 252,040 | 77 |
| triage | claude-sonnet-5-5 | 2 | 3,463 | 4 | 25,044 | 28 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,281 | 4 | 19,532 | 11 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,148 | 4 | 19,538 | 16 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 1,859 | 4 | 21,537 | 17 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,779 | 4 | 19,546 | 9 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,580 | 4 | 19,552 | 10 |
| machine:node --test scripts/*.test.mjs | claude-haiku-5-5 | 2 | 1,502 | 4 | 19,546 | 21 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,133 | 4 | 19,557 | 14 |
| judge:E7:spec-alignment | claude-sonnet-5-5 | 2 | 1,118 | 4 | 19,792 | 15 |
| judge:E7:domain-correctness | claude-sonnet-5-5 | 2 | 1,116 | 4 | 19,792 | 12 |
| judge:E7:operational-feasibility | claude-sonnet-5-5 | 2 | 1,011 | 4 | 19,794 | 10 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 553 | 4 | 19,534 | 9 |
| capture:provenance | claude-sonnet-5-5 | 2 | 420 | 4 | 15,273 | 6 |


wall: 187s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 1,859 | 21,537 | 17 | 15:22:22 | 15:22:39 |
| machine | 7 | 10,976 | 136,805 | 69 | 15:22:22 | 15:23:31 |
| judge | 3 | 3,245 | 59,378 | 18 | 15:22:22 | 15:22:40 |
| review | 3 | 19,748 | 713,879 | 89 | 15:22:22 | 15:23:51 |
| triage | 1 | 3,463 | 25,044 | 28 | 15:23:51 | 15:24:19 |
| capture | 1 | 420 | 15,273 | 6 | 15:24:19 | 15:24:26 |
| synthesize | 1 | 8,732 | 159,499 | 64 | 15:24:26 | 15:25:29 |

- **claude-sonnet-5-5**: 7 agent · 17 calls · out 17,719 · in 34 · cache_read 280,731 · cache_create 178,181
- **claude-opus-5-5**: 3 agent · 21 calls · out 19,748 · in 42 · cache_read 713,879 · cache_create 152,914
- **claude-haiku-5-5**: 7 agent · 14 calls · out 10,976 · in 28 · cache_read 136,805 · cache_create 137,965

