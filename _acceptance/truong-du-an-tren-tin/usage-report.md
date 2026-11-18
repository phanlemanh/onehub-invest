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

### S4 round 2 — wf_7d657e5f-b46 (11 agent, 24,475 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:cd pipeline && npm test | claude-haiku-5-5 | 14 | 7,138 | 28 | 408,796 | 1601 |
| synthesize:report | claude-sonnet-5-5 | 2 | 3,821 | 4 | 34,697 | 25 |
| machine:cd app && npm test | claude-haiku-5-5 | 5 | 3,755 | 10 | 94,018 | 710 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,641 | 4 | 29,077 | 47 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,565 | 4 | 29,089 | 7 |
| review:bugs | claude-opus-5-5 | 7 | 1,525 | 14 | 217,567 | 19 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,183 | 4 | 29,100 | 25 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,117 | 4 | 29,095 | 6 |
| review:measurement | claude-opus-5-5 | 3 | 719 | 6 | 59,017 | 9 |
| review:conventions | claude-opus-5-5 | 3 | 670 | 6 | 54,537 | 9 |
| capture:provenance | claude-sonnet-5-5 | 2 | 341 | 4 | 24,575 | 7 |


wall: 2427s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 6 | 17,399 | 619,175 | 2395 | 11:02:30 | 11:42:25 |
| review | 3 | 2,914 | 331,121 | 20 | 11:02:30 | 11:02:50 |
| capture | 1 | 341 | 24,575 | 7 | 11:42:26 | 11:42:33 |
| synthesize | 1 | 3,821 | 34,697 | 25 | 11:42:33 | 11:42:57 |

- **claude-haiku-5-5**: 6 agent · 27 calls · out 17,399 · in 54 · cache_read 619,175 · cache_create 226,068
- **claude-sonnet-5-5**: 2 agent · 4 calls · out 4,162 · in 8 · cache_read 59,272 · cache_create 73,680
- **claude-opus-5-5**: 3 agent · 13 calls · out 2,914 · in 26 · cache_read 331,121 · cache_create 100,769

### S4 round 3 — wf_14d735c5-63a (11 agent, 26,770 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:cd pipeline && npm test | claude-haiku-5-5 | 12 | 7,122 | 24 | 319,350 | 1285 |
| synthesize:report | claude-sonnet-5-5 | 5 | 3,628 | 10 | 166,539 | 36 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,657 | 4 | 29,067 | 34 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,529 | 4 | 3,300 | 417 |
| review:bugs | claude-opus-5-5 | 9 | 2,423 | 18 | 299,077 | 36 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,039 | 4 | 29,085 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,798 | 4 | 29,079 | 8 |
| review:conventions | claude-opus-5-5 | 6 | 1,694 | 12 | 156,593 | 18 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,348 | 4 | 29,090 | 18 |
| review:measurement | claude-opus-5-5 | 4 | 1,104 | 8 | 114,190 | 13 |
| capture:provenance | claude-sonnet-5-5 | 2 | 428 | 4 | 24,565 | 9 |


wall: 1816s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 6 | 17,493 | 438,971 | 1771 | 12:19:18 | 12:48:49 |
| review | 3 | 5,221 | 569,860 | 37 | 12:19:18 | 12:19:55 |
| capture | 1 | 428 | 24,565 | 9 | 12:48:49 | 12:48:58 |
| synthesize | 1 | 3,628 | 166,539 | 36 | 12:48:58 | 12:49:34 |

- **claude-haiku-5-5**: 6 agent · 22 calls · out 17,493 · in 44 · cache_read 438,971 · cache_create 224,490
- **claude-sonnet-5-5**: 2 agent · 7 calls · out 4,056 · in 14 · cache_read 191,104 · cache_create 73,153
- **claude-opus-5-5**: 3 agent · 19 calls · out 5,221 · in 38 · cache_read 569,860 · cache_create 120,540

