### S4 round 1 — wf_10e943e0-bdd (15 agent, 69,913 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 19 | 13,421 | 38 | 1,149,316 | 140 |
| review:bugs | claude-opus-5-5 | 9 | 13,291 | 20 | 496,089 | 134 |
| review:measurement | claude-opus-5-5 | 8 | 10,181 | 16 | 285,872 | 109 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 13 | 6,705 | 26 | 359,717 | 1185 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,604 | 4 | 40,160 | 38 |
| triage | claude-sonnet-5-5 | 2 | 4,521 | 4 | 30,432 | 41 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,938 | 6 | 64,791 | 46 |
| machine:cd pipeline && bash ../db/db-thu.sh onei | claude-haiku-5-5 | 3 | 2,970 | 6 | 60,661 | 75 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,905 | 4 | 28,076 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,763 | 4 | 28,070 | 8 |
| machine:cd app && npm test | claude-haiku-5-5 | 4 | 1,480 | 8 | 61,111 | 671 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,309 | 4 | 28,081 | 22 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 760 | 4 | 28,058 | 30 |
| machine:node --test pipeline/scripts/refresh-bai | claude-haiku-5-5 | 2 | 751 | 4 | 28,090 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 314 | 4 | 23,660 | 12 |


wall: 2016s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,938 | 64,791 | 46 | 11:18:14 | 11:19:00 |
| machine | 8 | 17,643 | 621,864 | 1925 | 11:18:14 | 11:50:19 |
| review | 3 | 36,893 | 1,931,277 | 140 | 11:18:14 | 11:20:34 |
| triage | 1 | 4,521 | 30,432 | 41 | 11:50:19 | 11:50:59 |
| capture | 1 | 314 | 23,660 | 12 | 11:50:59 | 11:51:12 |
| synthesize | 1 | 6,604 | 40,160 | 38 | 11:51:12 | 11:51:49 |

- **claude-opus-5-5**: 3 agent · 36 calls · out 36,893 · in 74 · cache_read 1,931,277 · cache_create 223,231
- **claude-haiku-5-5**: 8 agent · 30 calls · out 17,643 · in 60 · cache_read 621,864 · cache_create 273,780
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 15,377 · in 18 · cache_read 159,043 · cache_create 150,250

