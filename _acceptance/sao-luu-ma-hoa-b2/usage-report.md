### S4 round 1 — wf_a8a8684c-0d6 (19 agent, 67,629 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 7 | 10,545 | 14 | 331,465 | 114 |
| review:bugs | claude-opus-5-5 | 10 | 9,731 | 20 | 454,167 | 235 |
| synthesize:report | claude-sonnet-5-5 | 2 | 8,676 | 4 | 43,693 | 46 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 15 | 7,295 | 30 | 443,662 | 1616 |
| review:conventions | claude-opus-5-5 | 9 | 5,970 | 18 | 425,720 | 73 |
| triage | claude-sonnet-5-5 | 2 | 5,248 | 4 | 31,715 | 38 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,687 | 6 | 68,939 | 29 |
| machine:node --test scripts/check-freshness.test | claude-haiku-5-5 | 2 | 2,093 | 4 | 29,158 | 12 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,974 | 4 | 29,160 | 8 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 1,893 | 4 | 29,177 | 70 |
| refute:sao-luu-ngoai-may.itest.mjs | claude-sonnet-5-5 | 4 | 1,692 | 8 | 94,980 | 18 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,646 | 4 | 29,154 | 7 |
| refute:sao-luu-ngoai-may.mjs | claude-sonnet-5-5 | 4 | 1,266 | 10 | 87,944 | 15 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,249 | 4 | 25,842 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,246 | 4 | 29,165 | 18 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 773 | 4 | 29,178 | 17 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 673 | 4 | 3,300 | 468 |
| machine:node scripts/lib/sao-luu-ngoai-may.mjs - | claude-haiku-5-5 | 2 | 627 | 4 | 29,189 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 345 | 4 | 24,644 | 7 |


wall: 2236s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 26,246 | 1,211,352 | 237 | 04:32:37 | 04:36:34 |
| machine | 10 | 19,469 | 676,985 | 2126 | 04:32:37 | 05:08:03 |
| baseline | 1 | 4,687 | 68,939 | 29 | 04:32:37 | 04:33:06 |
| triage | 1 | 5,248 | 31,715 | 38 | 05:08:03 | 05:08:41 |
| refute | 2 | 2,958 | 182,924 | 19 | 05:08:41 | 05:09:00 |
| capture | 1 | 345 | 24,644 | 7 | 05:09:00 | 05:09:07 |
| synthesize | 1 | 8,676 | 43,693 | 46 | 05:09:07 | 05:09:53 |

- **claude-opus-5-5**: 3 agent · 26 calls · out 26,246 · in 52 · cache_read 1,211,352 · cache_create 217,639
- **claude-sonnet-5-5**: 6 agent · 17 calls · out 21,914 · in 36 · cache_read 351,915 · cache_create 225,999
- **claude-haiku-5-5**: 10 agent · 33 calls · out 19,469 · in 66 · cache_read 676,985 · cache_create 332,569

### S4 round 2 — wf_a0523aee-419 (17 agent, 52,667 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 10 | 11,328 | 20 | 510,457 | 130 |
| review:conventions | claude-opus-5-5 | 12 | 6,430 | 24 | 581,045 | 77 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,276 | 4 | 38,697 | 32 |
| review:measurement | claude-opus-5-5 | 4 | 5,239 | 8 | 110,773 | 56 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 10 | 4,944 | 20 | 255,460 | 1130 |
| triage | claude-sonnet-5-5 | 2 | 3,490 | 4 | 30,270 | 25 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,518 | 4 | 3,300 | 393 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 2,214 | 4 | 29,224 | 67 |
| machine:node --test scripts/check-freshness.test | claude-haiku-5-5 | 2 | 2,061 | 4 | 29,205 | 12 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,029 | 4 | 29,207 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,627 | 4 | 29,201 | 7 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,162 | 4 | 29,212 | 17 |
| refute:sao-luu-ngoai-may.mjs | claude-sonnet-5-5 | 3 | 1,080 | 6 | 56,000 | 11 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 789 | 4 | 29,225 | 23 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 580 | 4 | 25,889 | 29 |
| machine:node scripts/lib/sao-luu-ngoai-may.mjs - | claude-haiku-5-5 | 2 | 552 | 4 | 29,236 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 348 | 4 | 24,691 | 8 |


wall: 1661s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 22,997 | 1,202,275 | 132 | 05:53:14 | 05:55:26 |
| machine | 10 | 18,476 | 489,159 | 1584 | 05:53:14 | 06:19:38 |
| triage | 1 | 3,490 | 30,270 | 25 | 06:19:38 | 06:20:03 |
| refute | 1 | 1,080 | 56,000 | 11 | 06:20:03 | 06:20:14 |
| capture | 1 | 348 | 24,691 | 8 | 06:20:14 | 06:20:23 |
| synthesize | 1 | 6,276 | 38,697 | 32 | 06:20:23 | 06:20:55 |

- **claude-opus-5-5**: 3 agent · 26 calls · out 22,997 · in 52 · cache_read 1,202,275 · cache_create 200,759
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 11,194 · in 18 · cache_read 149,658 · cache_create 147,153
- **claude-haiku-5-5**: 10 agent · 28 calls · out 18,476 · in 56 · cache_read 489,159 · cache_create 331,067

