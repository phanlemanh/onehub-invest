### S4 round 1 — wf_fe79f9f5-8bb (14 agent, 27,597 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 11 | 3,600 | 22 | 442,483 | 52 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,510 | 6 | 69,926 | 223 |
| synthesize:report | claude-sonnet-5-5 | 2 | 2,714 | 4 | 32,920 | 18 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,680 | 4 | 31,356 | 41 |
| machine:cd pipeline && npm run test:b | claude-haiku-5-5 | 6 | 2,635 | 12 | 134,206 | 877 |
| review:conventions | claude-opus-5-5 | 8 | 2,477 | 16 | 253,305 | 36 |
| machine:cd pipeline && npm run test:a | claude-haiku-5-5 | 4 | 2,134 | 8 | 67,781 | 643 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,942 | 4 | 31,374 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,571 | 4 | 31,368 | 7 |
| review:measurement | claude-opus-5-5 | 4 | 1,461 | 8 | 102,106 | 22 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,145 | 4 | 31,379 | 8 |
| machine:cd app && bash ../db/db-thu.sh oneinvest | claude-haiku-5-5 | 2 | 724 | 4 | 31,453 | 41 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 591 | 4 | 0 | 534 |
| capture:provenance | claude-sonnet-5-5 | 2 | 413 | 4 | 26,855 | 4 |


wall: 2139s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,510 | 69,926 | 223 | 08:02:19 | 08:06:02 |
| review | 3 | 7,538 | 797,894 | 55 | 08:02:19 | 08:03:13 |
| machine | 8 | 13,422 | 358,917 | 2118 | 08:02:19 | 08:37:37 |
| capture | 1 | 413 | 26,855 | 4 | 08:37:37 | 08:37:40 |
| synthesize | 1 | 2,714 | 32,920 | 18 | 08:37:40 | 08:37:58 |

- **claude-opus-5-5**: 3 agent · 23 calls · out 7,538 · in 46 · cache_read 797,894 · cache_create 127,315
- **claude-sonnet-5-5**: 3 agent · 7 calls · out 6,637 · in 14 · cache_read 129,701 · cache_create 112,649
- **claude-haiku-5-5**: 8 agent · 22 calls · out 13,422 · in 44 · cache_read 358,917 · cache_create 328,742

### S4 round 2 — wf_45e5f533-073 (13 agent, 30,958 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:cd pipeline && npm run test:a | claude-haiku-5-5 | 9 | 4,672 | 18 | 238,204 | 871 |
| review:bugs | claude-opus-5-5 | 11 | 3,547 | 22 | 422,558 | 50 |
| machine:cd pipeline && npm run test:b | claude-haiku-5-5 | 8 | 3,480 | 16 | 202,560 | 1001 |
| review:measurement | claude-opus-5-5 | 6 | 3,272 | 12 | 188,200 | 40 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,733 | 4 | 31,323 | 40 |
| synthesize:report | claude-sonnet-5-5 | 2 | 2,581 | 4 | 34,058 | 16 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,443 | 4 | 3,300 | 577 |
| review:conventions | claude-opus-5-5 | 6 | 2,261 | 12 | 177,559 | 30 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,980 | 4 | 31,341 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,591 | 4 | 31,335 | 7 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,165 | 4 | 31,346 | 17 |
| triage | claude-sonnet-5-5 | 2 | 905 | 4 | 29,266 | 8 |
| capture:provenance | claude-sonnet-5-5 | 2 | 328 | 4 | 26,822 | 4 |


wall: 2549s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 7 | 18,064 | 569,409 | 2521 | 08:39:25 | 09:21:26 |
| review | 3 | 9,080 | 788,317 | 52 | 08:39:25 | 08:40:17 |
| triage | 1 | 905 | 29,266 | 8 | 09:21:26 | 09:21:33 |
| capture | 1 | 328 | 26,822 | 4 | 09:21:33 | 09:21:37 |
| synthesize | 1 | 2,581 | 34,058 | 16 | 09:21:37 | 09:21:53 |

- **claude-haiku-5-5**: 7 agent · 27 calls · out 18,064 · in 54 · cache_read 569,409 · cache_create 298,355
- **claude-opus-5-5**: 3 agent · 23 calls · out 9,080 · in 46 · cache_read 788,317 · cache_create 132,096
- **claude-sonnet-5-5**: 3 agent · 6 calls · out 3,814 · in 12 · cache_read 90,146 · cache_create 109,148

