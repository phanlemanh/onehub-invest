### S4 round 1 — wf_d9c79350-fe2 (14 agent, 29,578 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 2 | 4,616 | 4 | 28,355 | 28 |
| review:bugs | claude-opus-5-5 | 5 | 4,373 | 10 | 129,597 | 49 |
| review:conventions | claude-opus-5-5 | 6 | 3,184 | 12 | 194,066 | 38 |
| review:measurement | claude-opus-5-5 | 6 | 3,150 | 12 | 154,327 | 37 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,748 | 4 | 20,118 | 38 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,442 | 4 | 19,469 | 38 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,177 | 4 | 20,124 | 18 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,719 | 4 | 20,120 | 9 |
| triage | claude-sonnet-5-5 | 2 | 1,385 | 4 | 18,807 | 11 |
| machine:cd app && node --import tsx ../scripts/h | claude-haiku-5-5 | 2 | 1,184 | 4 | 20,150 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,008 | 4 | 20,143 | 12 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 650 | 4 | 20,138 | 5 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 512 | 4 | 20,132 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 430 | 4 | 18,775 | 5 |


wall: 146s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,442 | 19,469 | 38 | 05:05:16 | 05:05:54 |
| machine | 7 | 9,998 | 140,925 | 96 | 05:05:16 | 05:06:52 |
| review | 3 | 10,707 | 477,990 | 50 | 05:05:16 | 05:06:06 |
| triage | 1 | 1,385 | 18,807 | 11 | 05:06:54 | 05:07:05 |
| capture | 1 | 430 | 18,775 | 5 | 05:07:07 | 05:07:12 |
| synthesize | 1 | 4,616 | 28,355 | 28 | 05:07:14 | 05:07:42 |

- **claude-sonnet-5-5**: 4 agent · 8 calls · out 8,873 · in 16 · cache_read 85,406 · cache_create 96,923
- **claude-opus-5-5**: 3 agent · 17 calls · out 10,707 · in 34 · cache_read 477,990 · cache_create 128,991
- **claude-haiku-5-5**: 7 agent · 14 calls · out 9,998 · in 28 · cache_read 140,925 · cache_create 127,804

