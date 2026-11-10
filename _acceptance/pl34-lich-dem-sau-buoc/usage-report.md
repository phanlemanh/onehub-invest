### S4 round 1 — wf_e5a8e21f-ad0 (19 agent, 59,387 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 15 | 9,114 | 32 | 810,538 | 160 |
| review:bugs | claude-opus-5-5 | 16 | 8,124 | 32 | 796,114 | 264 |
| review:conventions | claude-opus-5-5 | 8 | 6,945 | 16 | 359,647 | 101 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 5,958 | 6 | 70,178 | 339 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 14 | 4,829 | 28 | 369,436 | 1550 |
| synthesize:report | claude-sonnet-5-5 | 2 | 4,828 | 4 | 37,132 | 27 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,665 | 4 | 27,657 | 44 |
| triage | claude-sonnet-5-5 | 2 | 2,408 | 4 | 28,015 | 18 |
| machine:cd app && npm test | claude-haiku-5-5 | 7 | 2,157 | 14 | 164,330 | 778 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,924 | 4 | 27,675 | 10 |
| machine:node --test scripts/nap-argmax.test.mjs | claude-haiku-5-5 | 2 | 1,907 | 4 | 27,733 | 111 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,742 | 4 | 27,669 | 9 |
| machine:node --test scripts/zalo-import-job.test | claude-haiku-5-5 | 2 | 1,492 | 4 | 27,677 | 14 |
| machine:node --test scripts/enrich-buoc-job.test | claude-haiku-5-5 | 2 | 1,241 | 4 | 27,681 | 12 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,090 | 4 | 27,680 | 26 |
| machine:node --test scripts/nap-ts-order.test.mj | claude-haiku-5-5 | 2 | 1,047 | 4 | 27,680 | 9 |
| machine:node --test scripts/zalo-import-job-lan. | claude-haiku-5-5 | 2 | 876 | 4 | 27,682 | 23 |
| machine:! bash scripts/pre-merge-check.sh . --ba | claude-haiku-5-5 | 2 | 696 | 4 | 27,811 | 149 |
| capture:provenance | claude-sonnet-5-5 | 2 | 344 | 4 | 23,272 | 5 |


wall: 2487s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 5,958 | 70,178 | 339 | 07:32:16 | 07:37:55 |
| machine | 12 | 21,666 | 810,711 | 2428 | 07:32:16 | 08:12:44 |
| review | 3 | 24,183 | 1,966,299 | 268 | 07:32:16 | 07:36:44 |
| triage | 1 | 2,408 | 28,015 | 18 | 08:12:46 | 08:13:05 |
| capture | 1 | 344 | 23,272 | 5 | 08:13:06 | 08:13:11 |
| synthesize | 1 | 4,828 | 37,132 | 27 | 08:13:16 | 08:13:43 |

- **claude-opus-5-5**: 3 agent · 39 calls · out 24,183 · in 80 · cache_read 1,966,299 · cache_create 209,785
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 13,538 · in 18 · cache_read 158,597 · cache_create 148,466
- **claude-haiku-5-5**: 12 agent · 41 calls · out 21,666 · in 82 · cache_read 810,711 · cache_create 370,289

