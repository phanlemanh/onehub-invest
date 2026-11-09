### S4 round 1 — wf_820226b2-ec3 (15 agent, 71,598 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 25 | 17,249 | 52 | 1,727,287 | 221 |
| review:conventions | claude-opus-5-5 | 22 | 14,087 | 46 | 1,459,392 | 181 |
| review:measurement | claude-opus-5-5 | 9 | 13,290 | 20 | 525,184 | 151 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,653 | 4 | 41,744 | 37 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,763 | 6 | 63,487 | 43 |
| triage | claude-sonnet-5-5 | 2 | 3,235 | 4 | 28,939 | 28 |
| machine:cd app && npm test | claude-haiku-5-5 | 5 | 2,893 | 10 | 89,812 | 759 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 4 | 2,284 | 8 | 60,092 | 769 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,884 | 4 | 27,743 | 10 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,575 | 4 | 27,737 | 9 |
| machine:cd pipeline && bash ../db/db-thu.sh onei | claude-haiku-5-5 | 2 | 1,557 | 4 | 27,805 | 85 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,253 | 4 | 27,771 | 26 |
| machine:cd pipeline && bash ../db/db-thu.sh onei | claude-haiku-5-5 | 2 | 968 | 4 | 27,787 | 235 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 572 | 4 | 24,536 | 63 |
| capture:provenance | claude-sonnet-5-5 | 2 | 335 | 4 | 23,337 | 6 |


wall: 1725s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,763 | 63,487 | 43 | 01:50:25 | 01:51:08 |
| machine | 8 | 12,986 | 313,283 | 1647 | 01:50:25 | 02:17:51 |
| review | 3 | 44,626 | 3,711,863 | 223 | 01:50:25 | 01:54:08 |
| triage | 1 | 3,235 | 28,939 | 28 | 02:17:53 | 02:18:21 |
| capture | 1 | 335 | 23,337 | 6 | 02:18:23 | 02:18:29 |
| synthesize | 1 | 6,653 | 41,744 | 37 | 02:18:32 | 02:19:09 |

- **claude-opus-5-5**: 3 agent · 56 calls · out 44,626 · in 118 · cache_read 3,711,863 · cache_create 283,538
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 13,986 · in 18 · cache_read 157,507 · cache_create 151,696
- **claude-haiku-5-5**: 8 agent · 21 calls · out 12,986 · in 42 · cache_read 313,283 · cache_create 262,166

### S4 round 2 (BLOCKED hạ tầng) — wf_96700403-4c6 (20 agent, 24,530 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 2 | 6,204 | 4 | 36,439 | 34 |
| review:conventions | claude-opus-5-5 | 9 | 4,074 | 18 | 259,611 | 69 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,689 | 6 | 63,521 | 37 |
| review:bugs | claude-opus-5-5 | 7 | 2,985 | 14 | 186,011 | 61 |
| machine:cd pipeline && bash ../db/db-thu.sh onei | claude-haiku-5-5 | 2 | 1,747 | 4 | 27,844 | 57 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,148 | 4 | 27,810 | 20 |
| machine:cd pipeline && bash ../db/db-thu.sh onei | claude-haiku-5-5 | 2 | 1,120 | 4 | 27,826 | 153 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 770 | 4 | 24,575 | 37 |
| refute:CONTEXT.md | claude-sonnet-5-5 | 2 | 694 | 4 | 26,987 | 136 |
| refute:CONTEXT.md | claude-sonnet-5-5 | 2 | 693 | 4 | 23,664 | 45 |
| review:measurement | claude-opus-5-5 | 2 | 503 | 4 | 27,125 | 11 |
| capture:provenance | claude-sonnet-5-5 | 2 | 343 | 4 | 23,376 | 6 |
| machine:cd app && npm test | claude-haiku-5-5 | 1 | 292 | 2 | 3,189 | 1051 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 1 | 268 | 2 | 0 | 1081 |
| triage | <synthetic> | 1 | 0 | 0 | 0 | 181 |
| machine:cd app && npm test | <synthetic> | 1 | 0 | 0 | 0 | 1051 |
| machine:cd pipeline && npm test | <synthetic> | 1 | 0 | 0 | 0 | 1081 |
| machine:cd app && npm run test:lint-rules | <synthetic> | 1 | 0 | 0 | 0 | 179 |
| triage | <synthetic> | 1 | 0 | 0 | 0 | 176 |
| machine:node scripts/check-portal-compliance.mjs | <synthetic> | 1 | 0 | 0 | 0 | 180 |


wall: 3090s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,689 | 63,521 | 37 | 02:23:42 | 02:24:20 |
| machine | 8 | 5,345 | 111,244 | 2551 | 02:23:42 | 03:06:14 |
| review | 3 | 7,562 | 472,747 | 69 | 02:23:42 | 02:24:51 |
| triage | 2 | 0 | 0 | 357 | 03:06:14 | 03:12:11 |
| refute | 2 | 1,387 | 50,651 | 136 | 03:12:11 | 03:14:27 |
| capture | 1 | 343 | 23,376 | 6 | 03:14:30 | 03:14:35 |
| synthesize | 1 | 6,204 | 36,439 | 34 | 03:14:38 | 03:15:12 |

- **claude-sonnet-5-5**: 5 agent · 11 calls · out 11,623 · in 22 · cache_read 173,987 · cache_create 162,250
- **claude-opus-5-5**: 3 agent · 18 calls · out 7,562 · in 36 · cache_read 472,747 · cache_create 98,740
- **claude-haiku-5-5**: 6 agent · 10 calls · out 5,345 · in 20 · cache_read 111,244 · cache_create 152,404
- **<synthetic>**: 6 agent · 6 calls · out 0 · in 0 · cache_read 0 · cache_create 0

### S4 round 3 — wf_cb280395-c9e (12 agent, 60,411 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 13 | 16,748 | 28 | 887,970 | 198 |
| review:conventions | claude-opus-5-5 | 26 | 13,915 | 56 | 1,788,662 | 195 |
| review:bugs | claude-opus-5-5 | 12 | 10,981 | 26 | 580,816 | 138 |
| synthesize:report | claude-sonnet-5-5 | 3 | 6,676 | 6 | 104,115 | 41 |
| triage | claude-sonnet-5-5 | 2 | 3,419 | 4 | 29,465 | 24 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,886 | 4 | 27,845 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,631 | 4 | 27,839 | 9 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 5 | 1,546 | 10 | 89,871 | 728 |
| machine:cd app && npm test | claude-haiku-5-5 | 3 | 1,320 | 6 | 31,551 | 612 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,186 | 4 | 27,850 | 19 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 766 | 4 | 24,638 | 31 |
| capture:provenance | claude-sonnet-5-5 | 2 | 337 | 4 | 23,439 | 7 |


wall: 1499s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 6 | 8,335 | 229,594 | 1420 | 03:17:50 | 03:41:30 |
| review | 3 | 41,644 | 3,257,448 | 200 | 03:17:50 | 03:21:09 |
| triage | 1 | 3,419 | 29,465 | 24 | 03:41:32 | 03:41:56 |
| capture | 1 | 337 | 23,439 | 7 | 03:41:58 | 03:42:05 |
| synthesize | 1 | 6,676 | 104,115 | 41 | 03:42:08 | 03:42:49 |

- **claude-opus-5-5**: 3 agent · 51 calls · out 41,644 · in 110 · cache_read 3,257,448 · cache_create 275,237
- **claude-sonnet-5-5**: 3 agent · 7 calls · out 10,432 · in 14 · cache_read 157,019 · cache_create 122,477
- **claude-haiku-5-5**: 6 agent · 16 calls · out 8,335 · in 32 · cache_read 229,594 · cache_create 211,349

