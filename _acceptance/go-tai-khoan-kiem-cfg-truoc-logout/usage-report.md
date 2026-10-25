### S4 round 1 — wf_afa3ea5d-ab6 (14 agent, 30,377 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 4 | 4,613 | 8 | 82,906 | 50 |
| review:bugs | claude-opus-5-5 | 8 | 4,507 | 16 | 225,545 | 57 |
| synthesize:report | claude-sonnet-5-5 | 2 | 3,908 | 4 | 23,730 | 25 |
| triage | claude-sonnet-5-5 | 3 | 3,057 | 6 | 43,284 | 22 |
| review:conventions | claude-opus-5-5 | 7 | 2,667 | 14 | 174,465 | 33 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,138 | 4 | 20,167 | 17 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 1,908 | 4 | 18,990 | 34 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,694 | 4 | 20,163 | 9 |
| refute:go-tai-khoan-kiem-cfg.test.tsx | claude-sonnet-5-5 | 3 | 1,565 | 6 | 37,340 | 16 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,512 | 4 | 20,175 | 7 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,143 | 4 | 20,186 | 12 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 646 | 4 | 20,181 | 5 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 589 | 4 | 17,104 | 29 |
| capture:provenance | claude-sonnet-5-5 | 2 | 430 | 4 | 15,904 | 5 |


wall: 164s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 1,908 | 18,990 | 34 | 03:43:26 | 03:44:00 |
| machine | 6 | 7,722 | 117,976 | 89 | 03:43:26 | 03:44:55 |
| review | 3 | 11,787 | 482,916 | 57 | 03:43:26 | 03:44:24 |
| triage | 1 | 3,057 | 43,284 | 22 | 03:44:57 | 03:45:19 |
| refute | 1 | 1,565 | 37,340 | 16 | 03:45:21 | 03:45:37 |
| capture | 1 | 430 | 15,904 | 5 | 03:45:39 | 03:45:44 |
| synthesize | 1 | 3,908 | 23,730 | 25 | 03:45:46 | 03:46:11 |

- **claude-opus-5-5**: 3 agent · 19 calls · out 11,787 · in 38 · cache_read 482,916 · cache_create 111,224
- **claude-sonnet-5-5**: 5 agent · 12 calls · out 10,868 · in 24 · cache_read 139,248 · cache_create 126,122
- **claude-haiku-5-5**: 6 agent · 12 calls · out 7,722 · in 24 · cache_read 117,976 · cache_create 113,534

