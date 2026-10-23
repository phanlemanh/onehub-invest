### S4 round 1 — wf_7291d711-a7c (15 agent, 69,151 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 23 | 15,332 | 46 | 1,282,801 | 168 |
| review:measurement | claude-opus-5-5 | 14 | 14,854 | 28 | 728,649 | 152 |
| review:conventions | claude-opus-5-5 | 20 | 9,725 | 40 | 1,048,391 | 112 |
| synthesize:report | claude-sonnet-5-5 | 3 | 8,096 | 6 | 79,191 | 46 |
| triage | claude-sonnet-5-5 | 2 | 4,283 | 4 | 21,602 | 32 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,527 | 4 | 19,490 | 11 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,460 | 4 | 18,843 | 22 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,171 | 4 | 19,496 | 14 |
| refute:test-posts.test.mjs | claude-sonnet-5-5 | 6 | 2,006 | 12 | 117,843 | 20 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,711 | 4 | 19,492 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,657 | 4 | 19,504 | 8 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,549 | 4 | 19,510 | 7 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,405 | 4 | 19,515 | 12 |
| machine:cd pipeline && node scripts/test-data-re | claude-haiku-5-5 | 2 | 1,035 | 4 | 19,519 | 7 |
| capture:provenance | claude-sonnet-5-5 | 2 | 340 | 4 | 15,233 | 6 |


wall: 273s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,460 | 18,843 | 22 | 10:05:46 | 10:06:08 |
| machine | 7 | 12,055 | 136,526 | 61 | 10:05:46 | 10:06:48 |
| review | 3 | 39,911 | 3,059,841 | 169 | 10:05:46 | 10:08:35 |
| triage | 1 | 4,283 | 21,602 | 32 | 10:08:35 | 10:09:07 |
| refute | 1 | 2,006 | 117,843 | 20 | 10:09:07 | 10:09:27 |
| capture | 1 | 340 | 15,233 | 6 | 10:09:27 | 10:09:33 |
| synthesize | 1 | 8,096 | 79,191 | 46 | 10:09:33 | 10:10:19 |

- **claude-opus-5-5**: 3 agent · 57 calls · out 39,911 · in 114 · cache_read 3,059,841 · cache_create 236,821
- **claude-sonnet-5-5**: 5 agent · 15 calls · out 17,185 · in 30 · cache_read 252,712 · cache_create 153,397
- **claude-haiku-5-5**: 7 agent · 14 calls · out 12,055 · in 28 · cache_read 136,526 · cache_create 137,272

