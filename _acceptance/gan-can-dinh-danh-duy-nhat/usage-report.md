### S4 round 1 — wf_05fe0948-df8 (16 agent, 87,924 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| ui:E10 | claude-sonnet-5-5 | 40 | 20,962 | 80 | 4,079,268 | 372 |
| review:conventions | claude-opus-5-5 | 27 | 12,391 | 56 | 2,043,156 | 146 |
| review:measurement | claude-opus-5-5 | 10 | 10,601 | 22 | 493,062 | 113 |
| review:bugs | claude-opus-5-5 | 20 | 8,722 | 44 | 1,239,056 | 106 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,713 | 4 | 41,045 | 37 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 15 | 5,848 | 30 | 401,494 | 1833 |
| machine:cd app && npm test | claude-haiku-5-5 | 13 | 4,976 | 26 | 335,319 | 1408 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,758 | 6 | 63,152 | 42 |
| triage | claude-sonnet-5-5 | 2 | 2,932 | 4 | 27,934 | 22 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,675 | 4 | 24,234 | 87 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,186 | 4 | 27,468 | 10 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 1,703 | 4 | 27,453 | 14 |
| machine:for f in app/src/components/ops/data-flo | claude-haiku-5-5 | 2 | 1,498 | 4 | 27,655 | 12 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,345 | 4 | 27,446 | 30 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,284 | 4 | 27,462 | 9 |
| capture:provenance | claude-sonnet-5-5 | 2 | 330 | 4 | 23,055 | 6 |


wall: 3457s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,758 | 63,152 | 42 | 16:55:33 | 16:56:15 |
| machine | 8 | 21,515 | 898,531 | 3385 | 16:55:33 | 17:51:58 |
| ui | 1 | 20,962 | 4,079,268 | 372 | 16:55:33 | 17:01:45 |
| review | 3 | 31,714 | 3,775,274 | 146 | 16:55:33 | 16:57:59 |
| triage | 1 | 2,932 | 27,934 | 22 | 17:52:00 | 17:52:22 |
| capture | 1 | 330 | 23,055 | 6 | 17:52:24 | 17:52:31 |
| synthesize | 1 | 6,713 | 41,045 | 37 | 17:52:32 | 17:53:09 |

- **claude-sonnet-5-5**: 5 agent · 49 calls · out 34,695 · in 98 · cache_read 4,234,454 · cache_create 282,257
- **claude-opus-5-5**: 3 agent · 57 calls · out 31,714 · in 122 · cache_read 3,775,274 · cache_create 278,192
- **claude-haiku-5-5**: 8 agent · 40 calls · out 21,515 · in 80 · cache_read 898,531 · cache_create 267,288

### S4 round 2 — wf_26e8c098-81a (13 agent, 40,433 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:cd pipeline && npm test | claude-haiku-5-5 | 9 | 9,665 | 18 | 263,813 | 722 |
| synthesize:report | claude-sonnet-5-5 | 4 | 5,697 | 8 | 151,984 | 36 |
| review:conventions | claude-opus-5-5 | 10 | 4,986 | 20 | 412,781 | 55 |
| review:bugs | claude-opus-5-5 | 12 | 4,772 | 24 | 506,516 | 57 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,849 | 4 | 27,442 | 35 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 2,745 | 6 | 60,245 | 38 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,007 | 4 | 27,460 | 9 |
| triage | claude-sonnet-5-5 | 2 | 1,760 | 4 | 26,117 | 15 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,691 | 4 | 27,454 | 8 |
| machine:cd app && npm test | claude-haiku-5-5 | 4 | 1,401 | 8 | 60,188 | 659 |
| review:measurement | claude-opus-5-5 | 4 | 1,390 | 8 | 108,172 | 16 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,151 | 4 | 27,465 | 18 |
| capture:provenance | claude-sonnet-5-5 | 2 | 319 | 4 | 23,047 | 5 |


wall: 1549s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,745 | 60,245 | 38 | 18:13:01 | 18:13:39 |
| machine | 6 | 18,764 | 433,822 | 1487 | 18:13:01 | 18:37:48 |
| review | 3 | 11,148 | 1,027,469 | 58 | 18:13:01 | 18:13:59 |
| triage | 1 | 1,760 | 26,117 | 15 | 18:37:50 | 18:38:05 |
| capture | 1 | 319 | 23,047 | 5 | 18:38:07 | 18:38:12 |
| synthesize | 1 | 5,697 | 151,984 | 36 | 18:38:14 | 18:38:50 |

- **claude-haiku-5-5**: 6 agent · 21 calls · out 18,764 · in 42 · cache_read 433,822 · cache_create 195,713
- **claude-sonnet-5-5**: 4 agent · 11 calls · out 10,521 · in 22 · cache_read 261,393 · cache_create 150,792
- **claude-opus-5-5**: 3 agent · 26 calls · out 11,148 · in 52 · cache_read 1,027,469 · cache_create 158,376

