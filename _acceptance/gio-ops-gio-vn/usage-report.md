### S4 round 1 — wf_f5ef9a94-379 (14 agent, 44,829 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 17 | 9,875 | 34 | 820,262 | 114 |
| review:bugs | claude-opus-5-5 | 22 | 8,850 | 44 | 1,112,204 | 131 |
| review:measurement | claude-opus-5-5 | 9 | 7,499 | 18 | 387,128 | 82 |
| synthesize:report | claude-sonnet-5-5 | 4 | 4,963 | 8 | 96,788 | 35 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,279 | 4 | 19,099 | 38 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,165 | 4 | 19,912 | 23 |
| triage | claude-sonnet-5-5 | 2 | 2,026 | 4 | 19,324 | 16 |
| refute:gio-ops-gio-vn.test.tsx | claude-sonnet-5-5 | 6 | 1,837 | 12 | 109,835 | 27 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,754 | 4 | 19,920 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,163 | 4 | 19,931 | 12 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 729 | 4 | 19,908 | 6 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 644 | 4 | 16,849 | 16 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 621 | 4 | 19,926 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 424 | 4 | 15,647 | 11 |


wall: 229s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,279 | 19,099 | 38 | 13:04:04 | 13:04:42 |
| machine | 6 | 7,076 | 116,446 | 82 | 13:04:04 | 13:05:26 |
| review | 3 | 26,224 | 2,319,594 | 132 | 13:04:04 | 13:06:15 |
| triage | 1 | 2,026 | 19,324 | 16 | 13:06:17 | 13:06:33 |
| refute | 1 | 1,837 | 109,835 | 27 | 13:06:36 | 13:07:02 |
| capture | 1 | 424 | 15,647 | 11 | 13:07:04 | 13:07:16 |
| synthesize | 1 | 4,963 | 96,788 | 35 | 13:07:18 | 13:07:52 |

- **claude-opus-5-5**: 3 agent · 48 calls · out 26,224 · in 96 · cache_read 2,319,594 · cache_create 194,627
- **claude-sonnet-5-5**: 5 agent · 16 calls · out 11,529 · in 32 · cache_read 260,693 · cache_create 133,189
- **claude-haiku-5-5**: 6 agent · 12 calls · out 7,076 · in 24 · cache_read 116,446 · cache_create 112,181

### S4 round 2 — wf_aa229142-09c (13 agent, 31,466 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 14 | 5,481 | 28 | 545,573 | 67 |
| synthesize:report | claude-sonnet-5-5 | 3 | 5,381 | 6 | 60,809 | 33 |
| review:conventions | claude-opus-5-5 | 10 | 4,201 | 20 | 271,572 | 50 |
| review:measurement | claude-opus-5-5 | 8 | 3,843 | 16 | 277,811 | 48 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,544 | 4 | 17,225 | 21 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,276 | 4 | 19,475 | 41 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,258 | 4 | 20,288 | 23 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,742 | 4 | 20,296 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,131 | 4 | 20,307 | 13 |
| triage | claude-sonnet-5-5 | 2 | 978 | 4 | 18,728 | 8 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 682 | 4 | 20,284 | 6 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 525 | 4 | 20,302 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 424 | 4 | 16,023 | 6 |


wall: 141s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,276 | 19,475 | 41 | 13:37:46 | 13:38:27 |
| machine | 6 | 8,882 | 118,702 | 88 | 13:37:46 | 13:39:14 |
| review | 3 | 13,525 | 1,094,956 | 68 | 13:37:46 | 13:38:54 |
| triage | 1 | 978 | 18,728 | 8 | 13:39:16 | 13:39:24 |
| capture | 1 | 424 | 16,023 | 6 | 13:39:26 | 13:39:32 |
| synthesize | 1 | 5,381 | 60,809 | 33 | 13:39:34 | 13:40:07 |

- **claude-opus-5-5**: 3 agent · 32 calls · out 13,525 · in 64 · cache_read 1,094,956 · cache_create 144,516
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 9,059 · in 18 · cache_read 115,035 · cache_create 111,420
- **claude-haiku-5-5**: 6 agent · 12 calls · out 8,882 · in 24 · cache_read 118,702 · cache_create 113,951

