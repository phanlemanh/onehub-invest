### S4 round 1 — wf_1542d1b2-c57 (19 agent, 91,728 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| ui:E17 | claude-sonnet-5-5 | 30 | 20,111 | 60 | 3,032,242 | 275 |
| review:bugs | claude-opus-5-5 | 16 | 12,533 | 32 | 923,216 | 160 |
| synthesize:report | claude-sonnet-5-5 | 3 | 11,957 | 6 | 88,923 | 66 |
| review:conventions | claude-opus-5-5 | 23 | 10,394 | 46 | 1,583,346 | 151 |
| review:measurement | claude-opus-5-5 | 7 | 9,885 | 14 | 328,842 | 114 |
| triage | claude-sonnet-5-5 | 2 | 4,424 | 4 | 22,497 | 31 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 4,090 | 4 | 24,371 | 59 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,614 | 4 | 20,352 | 44 |
| judge:E16:domain-correctness | claude-sonnet-5-5 | 2 | 2,388 | 4 | 17,392 | 18 |
| judge:E16:operational-feasibility | claude-sonnet-5-5 | 2 | 2,166 | 4 | 20,922 | 18 |
| judge:E16:spec-alignment | claude-sonnet-5-5 | 2 | 2,081 | 4 | 20,920 | 16 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,823 | 4 | 20,403 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,682 | 4 | 20,397 | 8 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,553 | 4 | 20,385 | 8 |
| machine:cd app && node --test eslint-plugin-oneh | claude-haiku-5-5 | 2 | 990 | 4 | 20,391 | 6 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 971 | 4 | 20,408 | 12 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 916 | 4 | 20,389 | 14 |
| machine:BASE_URL=${BASE_URL:-http://localhost:34 | claude-haiku-5-5 | 2 | 727 | 4 | 20,404 | 50 |
| capture:provenance | claude-sonnet-5-5 | 2 | 423 | 4 | 16,408 | 5 |


wall: 376s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,090 | 24,371 | 59 | 02:51:10 | 02:52:08 |
| machine | 8 | 11,276 | 163,129 | 94 | 02:51:10 | 02:52:44 |
| ui | 1 | 20,111 | 3,032,242 | 275 | 02:51:10 | 02:55:45 |
| judge | 3 | 6,635 | 59,234 | 19 | 02:51:10 | 02:51:29 |
| review | 3 | 32,812 | 2,835,404 | 163 | 02:51:10 | 02:53:52 |
| triage | 1 | 4,424 | 22,497 | 31 | 02:55:45 | 02:56:16 |
| capture | 1 | 423 | 16,408 | 5 | 02:56:16 | 02:56:20 |
| synthesize | 1 | 11,957 | 88,923 | 66 | 02:56:20 | 02:57:26 |

- **claude-sonnet-5-5**: 8 agent · 45 calls · out 47,640 · in 90 · cache_read 3,243,675 · cache_create 403,529
- **claude-opus-5-5**: 3 agent · 46 calls · out 32,812 · in 92 · cache_read 2,835,404 · cache_create 263,066
- **claude-haiku-5-5**: 8 agent · 16 calls · out 11,276 · in 32 · cache_read 163,129 · cache_create 148,208

