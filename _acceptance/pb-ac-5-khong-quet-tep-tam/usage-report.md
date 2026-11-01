### S4 round 1 — wf_2274945e-fdb (12 agent, 26,815 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 11 | 4,577 | 22 | 322,238 | 65 |
| review:measurement | claude-opus-5-5 | 6 | 3,623 | 12 | 148,480 | 46 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 2,806 | 6 | 49,114 | 200 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,471 | 4 | 21,627 | 61 |
| synthesize:report | claude-sonnet-5-5 | 2 | 2,386 | 4 | 24,044 | 17 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,247 | 4 | 18,599 | 296 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,140 | 4 | 21,629 | 22 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,820 | 4 | 21,647 | 9 |
| review:conventions | claude-opus-5-5 | 5 | 1,791 | 10 | 112,348 | 29 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,668 | 4 | 21,641 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 957 | 4 | 21,652 | 16 |
| capture:provenance | claude-sonnet-5-5 | 2 | 329 | 4 | 17,393 | 6 |


wall: 436s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,806 | 49,114 | 200 | 05:57:39 | 06:00:59 |
| machine | 6 | 11,303 | 126,795 | 413 | 05:57:39 | 06:04:32 |
| review | 3 | 9,991 | 583,066 | 68 | 05:57:39 | 05:58:47 |
| capture | 1 | 329 | 17,393 | 6 | 06:04:32 | 06:04:38 |
| synthesize | 1 | 2,386 | 24,044 | 17 | 06:04:38 | 06:04:55 |

- **claude-opus-5-5**: 3 agent · 22 calls · out 9,991 · in 44 · cache_read 583,066 · cache_create 102,894
- **claude-sonnet-5-5**: 3 agent · 7 calls · out 5,521 · in 14 · cache_read 90,551 · cache_create 83,285
- **claude-haiku-5-5**: 6 agent · 12 calls · out 11,303 · in 24 · cache_read 126,795 · cache_create 124,460

