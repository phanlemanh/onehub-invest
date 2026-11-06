### S4 round 1 — wf_9921787b-2d1 (17 agent, 92,308 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 7 | 21,724 | 16 | 489,653 | 222 |
| review:measurement | claude-opus-5-5 | 6 | 17,790 | 14 | 285,387 | 179 |
| review:conventions | claude-opus-5-5 | 8 | 16,978 | 18 | 446,590 | 174 |
| synthesize:report | claude-sonnet-5-5 | 2 | 8,491 | 4 | 40,217 | 46 |
| triage | claude-sonnet-5-5 | 2 | 5,054 | 4 | 28,241 | 36 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,846 | 6 | 59,680 | 42 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,743 | 4 | 21,083 | 33 |
| machine:cd agent && node --import tsx --test --t | claude-haiku-5-5 | 2 | 2,506 | 4 | 24,299 | 36 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,140 | 4 | 24,227 | 217 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,946 | 4 | 24,241 | 9 |
| machine:cd agent && node --import tsx --test tes | claude-haiku-5-5 | 2 | 1,847 | 4 | 24,253 | 9 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 1,746 | 4 | 24,221 | 268 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,694 | 4 | 24,235 | 9 |
| machine:cd agent && node --env-file=../.env --im | claude-haiku-5-5 | 2 | 973 | 4 | 24,352 | 32 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 864 | 4 | 24,246 | 16 |
| machine:cd agent && node --import tsx --test --t | claude-haiku-5-5 | 2 | 636 | 4 | 24,264 | 17 |
| capture:provenance | claude-sonnet-5-5 | 2 | 330 | 4 | 19,882 | 5 |


wall: 652s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,846 | 59,680 | 42 | 03:41:51 | 03:42:33 |
| machine | 10 | 17,095 | 239,421 | 561 | 03:41:51 | 03:51:12 |
| review | 3 | 56,492 | 1,221,630 | 223 | 03:41:51 | 03:45:34 |
| triage | 1 | 5,054 | 28,241 | 36 | 03:51:14 | 03:51:49 |
| capture | 1 | 330 | 19,882 | 5 | 03:51:51 | 03:51:56 |
| synthesize | 1 | 8,491 | 40,217 | 46 | 03:51:58 | 03:52:43 |

- **claude-opus-5-5**: 3 agent · 21 calls · out 56,492 · in 48 · cache_read 1,221,630 · cache_create 321,056
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 18,721 · in 18 · cache_read 148,020 · cache_create 141,718
- **claude-haiku-5-5**: 10 agent · 20 calls · out 17,095 · in 40 · cache_read 239,421 · cache_create 225,303

### S4 round 2 — wf_e0372694-d73 (12 agent, 54,802 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 10 | 21,689 | 22 | 739,541 | 219 |
| review:measurement | claude-opus-5-5 | 8 | 10,970 | 18 | 376,388 | 108 |
| review:conventions | claude-opus-5-5 | 6 | 5,758 | 12 | 216,717 | 57 |
| synthesize:report | claude-sonnet-5-5 | 2 | 4,559 | 4 | 32,645 | 27 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,402 | 4 | 24,261 | 220 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,204 | 4 | 24,267 | 173 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,953 | 4 | 24,281 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,643 | 4 | 24,275 | 8 |
| triage | claude-sonnet-5-5 | 2 | 1,639 | 4 | 23,937 | 13 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 934 | 4 | 24,286 | 16 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 722 | 4 | 21,123 | 21 |
| capture:provenance | claude-sonnet-5-5 | 2 | 329 | 4 | 19,922 | 6 |


wall: 510s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 6 | 9,858 | 142,493 | 459 | 03:57:40 | 04:05:19 |
| review | 3 | 38,417 | 1,332,646 | 220 | 03:57:40 | 04:01:20 |
| triage | 1 | 1,639 | 23,937 | 13 | 04:05:21 | 04:05:34 |
| capture | 1 | 329 | 19,922 | 6 | 04:05:36 | 04:05:42 |
| synthesize | 1 | 4,559 | 32,645 | 27 | 04:05:43 | 04:06:11 |

- **claude-opus-5-5**: 3 agent · 24 calls · out 38,417 · in 52 · cache_read 1,332,646 · cache_create 284,593
- **claude-sonnet-5-5**: 3 agent · 6 calls · out 6,527 · in 12 · cache_read 76,504 · cache_create 96,133
- **claude-haiku-5-5**: 6 agent · 12 calls · out 9,858 · in 24 · cache_read 142,493 · cache_create 138,108

