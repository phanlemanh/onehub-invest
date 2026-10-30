### S4 round 1 — wf_3ec35055-c1c (15 agent, 52,443 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 5 | 8,202 | 10 | 123,585 | 90 |
| synthesize:report | claude-sonnet-5-5 | 2 | 7,975 | 4 | 32,943 | 48 |
| review:conventions | claude-opus-5-5 | 9 | 7,809 | 18 | 325,960 | 91 |
| review:measurement | claude-opus-5-5 | 4 | 4,720 | 8 | 81,745 | 52 |
| triage | claude-sonnet-5-5 | 2 | 4,056 | 4 | 22,796 | 31 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,516 | 4 | 21,624 | 20 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,635 | 4 | 21,031 | 57 |
| machine:bash db/db-thu.sh oneinvest_p1_n1 && cd | claude-haiku-5-5 | 2 | 2,484 | 4 | 21,205 | 48 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,267 | 4 | 18,003 | 63 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,116 | 4 | 21,051 | 10 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 2,076 | 4 | 21,045 | 10 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,908 | 4 | 21,033 | 16 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,203 | 4 | 21,056 | 19 |
| machine:cd pipeline && node scripts/so-gia-ty-ch | claude-haiku-5-5 | 2 | 1,039 | 4 | 21,068 | 8 |
| capture:provenance | claude-sonnet-5-5 | 2 | 437 | 4 | 16,797 | 6 |


wall: 259s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,516 | 21,624 | 20 | 02:52:10 | 02:52:31 |
| machine | 8 | 15,728 | 165,492 | 174 | 02:52:10 | 02:55:05 |
| review | 3 | 20,731 | 531,290 | 92 | 02:52:10 | 02:53:43 |
| triage | 1 | 4,056 | 22,796 | 31 | 02:55:05 | 02:55:36 |
| capture | 1 | 437 | 16,797 | 6 | 02:55:36 | 02:55:42 |
| synthesize | 1 | 7,975 | 32,943 | 48 | 02:55:42 | 02:56:30 |

- **claude-opus-5-5**: 3 agent · 18 calls · out 20,731 · in 36 · cache_read 531,290 · cache_create 135,974
- **claude-sonnet-5-5**: 4 agent · 8 calls · out 15,984 · in 16 · cache_read 94,160 · cache_create 120,399
- **claude-haiku-5-5**: 8 agent · 16 calls · out 15,728 · in 32 · cache_read 165,492 · cache_create 159,785

### S4 round 2 — wf_30523a2d-f5d (13 agent, 30,087 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 6 | 6,235 | 12 | 194,846 | 47 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,941 | 4 | 21,088 | 18 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,692 | 4 | 21,040 | 53 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,451 | 4 | 21,046 | 50 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,229 | 4 | 21,042 | 17 |
| review:bugs | claude-opus-5-5 | 8 | 2,222 | 18 | 199,860 | 35 |
| machine:bash db/db-thu.sh oneinvest_p1_n1 && cd | claude-haiku-5-5 | 2 | 2,114 | 4 | 21,214 | 42 |
| review:measurement | claude-opus-5-5 | 6 | 2,060 | 12 | 136,382 | 28 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,031 | 4 | 21,060 | 9 |
| review:conventions | claude-opus-5-5 | 7 | 1,948 | 14 | 157,469 | 28 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,778 | 4 | 21,054 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,043 | 4 | 21,065 | 14 |
| capture:provenance | claude-sonnet-5-5 | 2 | 343 | 4 | 16,806 | 5 |


wall: 205s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,941 | 21,088 | 18 | 02:58:53 | 02:59:11 |
| machine | 7 | 14,338 | 147,521 | 153 | 02:58:53 | 03:01:26 |
| review | 3 | 6,230 | 493,711 | 37 | 02:58:53 | 02:59:30 |
| capture | 1 | 343 | 16,806 | 5 | 03:01:26 | 03:01:31 |
| synthesize | 1 | 6,235 | 194,846 | 47 | 03:01:31 | 03:02:18 |

- **claude-sonnet-5-5**: 3 agent · 10 calls · out 9,519 · in 20 · cache_read 232,740 · cache_create 97,164
- **claude-haiku-5-5**: 7 agent · 14 calls · out 14,338 · in 28 · cache_read 147,521 · cache_create 137,672
- **claude-opus-5-5**: 3 agent · 21 calls · out 6,230 · in 44 · cache_read 493,711 · cache_create 105,604

