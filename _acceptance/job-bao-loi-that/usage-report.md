### S4 round 1 — wf_ad38f18b-391 (17 agent, 47,775 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 7 | 8,182 | 14 | 229,922 | 90 |
| review:conventions | claude-opus-5-5 | 14 | 7,282 | 28 | 639,010 | 101 |
| review:bugs | claude-opus-5-5 | 10 | 6,145 | 20 | 427,120 | 81 |
| synthesize:report | claude-sonnet-5-5 | 4 | 6,136 | 8 | 109,815 | 55 |
| triage | claude-sonnet-5-5 | 2 | 2,451 | 4 | 23,412 | 28 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,331 | 4 | 19,534 | 13 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,116 | 4 | 19,528 | 12 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 1,894 | 4 | 21,535 | 17 |
| machine:node --test scripts/*.test.mjs | claude-haiku-5-5 | 2 | 1,783 | 4 | 19,542 | 14 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,749 | 4 | 19,542 | 9 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,594 | 4 | 19,530 | 10 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,476 | 4 | 19,548 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,169 | 4 | 19,553 | 14 |
| judge:E7:domain-correctness | claude-sonnet-5-5 | 3 | 1,127 | 6 | 48,611 | 14 |
| judge:E7:operational-feasibility | claude-sonnet-5-5 | 2 | 1,002 | 4 | 19,848 | 13 |
| judge:E7:spec-alignment | claude-sonnet-5-5 | 3 | 930 | 6 | 48,633 | 13 |
| capture:provenance | claude-sonnet-5-5 | 2 | 408 | 4 | 18,183 | 7 |


wall: 192s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 1,894 | 21,535 | 17 | 09:59:44 | 10:00:01 |
| machine | 7 | 12,218 | 136,777 | 66 | 09:59:44 | 10:00:50 |
| judge | 3 | 3,059 | 117,092 | 17 | 09:59:44 | 10:00:01 |
| review | 3 | 21,609 | 1,296,052 | 101 | 09:59:44 | 10:01:26 |
| triage | 1 | 2,451 | 23,412 | 28 | 10:01:26 | 10:01:53 |
| capture | 1 | 408 | 18,183 | 7 | 10:01:53 | 10:02:01 |
| synthesize | 1 | 6,136 | 109,815 | 55 | 10:02:01 | 10:02:56 |

- **claude-opus-5-5**: 3 agent · 31 calls · out 21,609 · in 62 · cache_read 1,296,052 · cache_create 166,360
- **claude-sonnet-5-5**: 7 agent · 18 calls · out 13,948 · in 36 · cache_read 290,037 · cache_create 186,132
- **claude-haiku-5-5**: 7 agent · 14 calls · out 12,218 · in 28 · cache_read 136,777 · cache_create 137,254

