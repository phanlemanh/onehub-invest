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

