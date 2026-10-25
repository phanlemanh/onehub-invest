### S4 round 1 — wf_026e146b-55f (20 agent, 50,735 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 5 | 7,590 | 10 | 144,332 | 52 |
| review:conventions | claude-opus-5-5 | 11 | 7,158 | 22 | 367,476 | 72 |
| review:measurement | claude-opus-5-5 | 9 | 6,115 | 18 | 332,666 | 65 |
| review:bugs | claude-opus-5-5 | 12 | 5,982 | 24 | 391,424 | 70 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,143 | 4 | 20,137 | 19 |
| triage | claude-sonnet-5-5 | 2 | 3,120 | 4 | 21,115 | 22 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,613 | 4 | 20,111 | 29 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,170 | 4 | 20,117 | 17 |
| machine:node --test --test-skip-pattern=GT-AC-1 | claude-haiku-5-5 | 2 | 1,935 | 4 | 20,155 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,712 | 4 | 20,125 | 7 |
| refute:evals.yaml | claude-sonnet-5-5 | 3 | 1,523 | 6 | 41,320 | 13 |
| refute:slo-mot-nguon.test.tsx | claude-sonnet-5-5 | 3 | 1,394 | 6 | 43,979 | 14 |
| refute:s05-slo.test.mjs | claude-sonnet-5-5 | 3 | 1,219 | 6 | 41,077 | 13 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 986 | 4 | 20,136 | 11 |
| machine:node --test scripts/s05-slo.test.mjs | claude-haiku-5-5 | 2 | 816 | 4 | 20,133 | 6 |
| machine:node --test scripts/freshness-parity.tes | claude-haiku-5-5 | 2 | 766 | 4 | 20,132 | 5 |
| refute:check-freshness.mjs | claude-sonnet-5-5 | 2 | 743 | 4 | 19,091 | 7 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 711 | 4 | 17,056 | 6 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 690 | 4 | 20,131 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 349 | 4 | 15,854 | 6 |


wall: 171s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,143 | 20,137 | 19 | 07:23:16 | 07:23:34 |
| machine | 9 | 12,399 | 178,096 | 75 | 07:23:16 | 07:24:31 |
| review | 3 | 19,255 | 1,091,566 | 72 | 07:23:16 | 07:24:27 |
| triage | 1 | 3,120 | 21,115 | 22 | 07:24:31 | 07:24:53 |
| refute | 4 | 4,879 | 145,467 | 15 | 07:24:53 | 07:25:08 |
| capture | 1 | 349 | 15,854 | 6 | 07:25:08 | 07:25:14 |
| synthesize | 1 | 7,590 | 144,332 | 52 | 07:25:14 | 07:26:07 |

- **claude-sonnet-5-5**: 8 agent · 22 calls · out 19,081 · in 44 · cache_read 346,905 · cache_create 211,232
- **claude-opus-5-5**: 3 agent · 32 calls · out 19,255 · in 64 · cache_read 1,091,566 · cache_create 139,450
- **claude-haiku-5-5**: 9 agent · 18 calls · out 12,399 · in 36 · cache_read 178,096 · cache_create 167,138

### S4 round 2 — wf_a9d4d5d6-e36 (14 agent, 29,612 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 10 | 5,888 | 20 | 356,143 | 62 |
| synthesize:report | claude-sonnet-5-5 | 4 | 5,858 | 8 | 103,277 | 40 |
| review:bugs | claude-opus-5-5 | 12 | 4,422 | 24 | 362,645 | 49 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,124 | 4 | 20,154 | 16 |
| review:conventions | claude-opus-5-5 | 8 | 2,101 | 16 | 177,315 | 27 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,054 | 4 | 19,108 | 13 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,741 | 4 | 20,168 | 7 |
| triage | claude-sonnet-5-5 | 2 | 1,133 | 4 | 18,692 | 10 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 984 | 4 | 20,173 | 11 |
| machine:node --test scripts/s05-slo.test.mjs | claude-haiku-5-5 | 2 | 944 | 4 | 20,170 | 5 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 725 | 4 | 20,148 | 25 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 613 | 4 | 20,150 | 5 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 590 | 4 | 20,162 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 435 | 4 | 18,805 | 4 |


wall: 124s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,054 | 19,108 | 13 | 07:28:44 | 07:28:57 |
| machine | 7 | 7,721 | 141,125 | 69 | 07:28:44 | 07:29:54 |
| review | 3 | 12,411 | 896,103 | 62 | 07:28:44 | 07:29:46 |
| triage | 1 | 1,133 | 18,692 | 10 | 07:29:54 | 07:30:04 |
| capture | 1 | 435 | 18,805 | 4 | 07:30:04 | 07:30:08 |
| synthesize | 1 | 5,858 | 103,277 | 40 | 07:30:08 | 07:30:48 |

- **claude-opus-5-5**: 3 agent · 30 calls · out 12,411 · in 60 · cache_read 896,103 · cache_create 112,317
- **claude-sonnet-5-5**: 4 agent · 10 calls · out 9,480 · in 20 · cache_read 159,882 · cache_create 107,183
- **claude-haiku-5-5**: 7 agent · 14 calls · out 7,721 · in 28 · cache_read 141,125 · cache_create 128,020

