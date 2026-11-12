### S4 round 1 — wf_657d40f7-93e (14 agent, 38,523 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 16 | 7,352 | 32 | 817,705 | 82 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 13 | 7,043 | 26 | 349,322 | 1377 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,123 | 6 | 67,382 | 45 |
| synthesize:report | claude-sonnet-5-5 | 2 | 3,684 | 4 | 36,096 | 25 |
| review:conventions | claude-opus-5-5 | 8 | 3,395 | 16 | 285,565 | 35 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,835 | 4 | 29,105 | 34 |
| review:measurement | claude-opus-5-5 | 4 | 2,500 | 8 | 108,783 | 26 |
| triage | claude-sonnet-5-5 | 3 | 2,193 | 6 | 60,664 | 21 |
| machine:node --test --test-concurrency=1 pipelin | claude-haiku-5-5 | 2 | 1,757 | 4 | 29,145 | 58 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,114 | 4 | 29,128 | 15 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,094 | 4 | 29,123 | 5 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 554 | 4 | 29,117 | 5 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 533 | 4 | 3,300 | 471 |
| capture:provenance | claude-sonnet-5-5 | 2 | 346 | 4 | 24,603 | 8 |


wall: 1960s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 13,247 | 1,212,053 | 83 | 10:28:24 | 10:29:47 |
| machine | 7 | 14,930 | 498,240 | 1907 | 10:28:24 | 11:00:10 |
| baseline | 1 | 4,123 | 67,382 | 45 | 10:28:24 | 10:29:08 |
| triage | 1 | 2,193 | 60,664 | 21 | 11:00:10 | 11:00:31 |
| capture | 1 | 346 | 24,603 | 8 | 11:00:31 | 11:00:39 |
| synthesize | 1 | 3,684 | 36,096 | 25 | 11:00:39 | 11:01:04 |

- **claude-opus-5-5**: 3 agent · 28 calls · out 13,247 · in 56 · cache_read 1,212,053 · cache_create 166,257
- **claude-haiku-5-5**: 7 agent · 25 calls · out 14,930 · in 50 · cache_read 498,240 · cache_create 251,883
- **claude-sonnet-5-5**: 4 agent · 10 calls · out 10,346 · in 20 · cache_read 188,745 · cache_create 147,893

