### S4 round 1 — wf_8bd3b4e3-f99 (16 agent, 106,767 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 13 | 29,718 | 28 | 1,099,953 | 311 |
| review:measurement | claude-opus-5-5 | 5 | 22,603 | 10 | 193,234 | 224 |
| review:conventions | claude-opus-5-5 | 10 | 21,008 | 20 | 618,105 | 212 |
| synthesize:report | claude-sonnet-5-5 | 4 | 8,269 | 8 | 134,031 | 51 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,598 | 6 | 56,930 | 37 |
| triage | claude-sonnet-5-5 | 2 | 3,358 | 4 | 27,429 | 23 |
| machine:cd app && npm test | claude-haiku-5-5 | 5 | 3,244 | 10 | 81,715 | 763 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,882 | 4 | 21,627 | 57 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,460 | 4 | 3,140 | 553 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,062 | 4 | 25,179 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,903 | 4 | 25,173 | 9 |
| triage | claude-sonnet-5-5 | 3 | 1,502 | 6 | 55,718 | 11 |
| machine:cd pipeline && node --test scripts/eval- | claude-haiku-5-5 | 2 | 1,426 | 4 | 24,797 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,281 | 4 | 24,790 | 28 |
| machine:node _acceptance/eval-classify-theo-chu- | claude-haiku-5-5 | 2 | 1,124 | 4 | 24,800 | 18 |
| capture:provenance | claude-sonnet-5-5 | 2 | 329 | 4 | 20,818 | 4 |


wall: 1530s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,598 | 56,930 | 37 | 15:55:17 | 15:55:54 |
| machine | 8 | 16,382 | 231,221 | 1431 | 15:55:17 | 16:19:08 |
| review | 3 | 73,329 | 1,911,292 | 312 | 15:55:17 | 16:00:29 |
| triage | 2 | 4,860 | 83,147 | 37 | 16:19:11 | 16:19:48 |
| capture | 1 | 329 | 20,818 | 4 | 16:19:50 | 16:19:54 |
| synthesize | 1 | 8,269 | 134,031 | 51 | 16:19:56 | 16:20:47 |

- **claude-opus-5-5**: 3 agent · 28 calls · out 73,329 · in 58 · cache_read 1,911,292 · cache_create 301,518
- **claude-sonnet-5-5**: 5 agent · 14 calls · out 17,056 · in 28 · cache_read 294,926 · cache_create 162,430
- **claude-haiku-5-5**: 8 agent · 19 calls · out 16,382 · in 38 · cache_read 231,221 · cache_create 233,389

### S4 round 2 — wf_669cad29-c2f (13 agent, 82,127 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 8 | 19,450 | 16 | 478,897 | 197 |
| review:conventions | claude-opus-5-5 | 8 | 18,077 | 16 | 477,425 | 191 |
| review:measurement | claude-opus-5-5 | 4 | 17,320 | 8 | 141,208 | 168 |
| synthesize:report | claude-sonnet-5-5 | 4 | 8,270 | 8 | 139,173 | 50 |
| triage | claude-sonnet-5-5 | 2 | 5,124 | 4 | 26,927 | 37 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,875 | 4 | 3,140 | 387 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,532 | 4 | 25,195 | 302 |
| refute:db.mjs | claude-sonnet-5-5 | 4 | 2,302 | 8 | 86,799 | 23 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,085 | 4 | 25,209 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,736 | 4 | 25,203 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,269 | 4 | 25,214 | 18 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 745 | 4 | 22,051 | 23 |
| capture:provenance | claude-sonnet-5-5 | 2 | 342 | 4 | 20,848 | 4 |


wall: 883s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 6 | 11,242 | 126,012 | 760 | 16:29:05 | 16:41:44 |
| review | 3 | 54,847 | 1,097,530 | 199 | 16:29:05 | 16:32:24 |
| triage | 1 | 5,124 | 26,927 | 37 | 16:41:46 | 16:42:24 |
| refute | 1 | 2,302 | 86,799 | 23 | 16:42:26 | 16:42:49 |
| capture | 1 | 342 | 20,848 | 4 | 16:42:51 | 16:42:55 |
| synthesize | 1 | 8,270 | 139,173 | 50 | 16:42:58 | 16:43:48 |

- **claude-opus-5-5**: 3 agent · 20 calls · out 54,847 · in 40 · cache_read 1,097,530 · cache_create 271,215
- **claude-sonnet-5-5**: 4 agent · 12 calls · out 16,038 · in 24 · cache_read 273,747 · cache_create 141,498
- **claude-haiku-5-5**: 6 agent · 12 calls · out 11,242 · in 24 · cache_read 126,012 · cache_create 166,954

