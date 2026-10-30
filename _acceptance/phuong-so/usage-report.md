### S4 round 1 — wf_28383eb5-c16 (14 agent, 28,500 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 7 | 5,026 | 16 | 203,927 | 150 |
| synthesize:report | claude-sonnet-5-5 | 2 | 3,625 | 4 | 27,289 | 25 |
| review:measurement | claude-opus-5-5 | 4 | 2,735 | 10 | 94,286 | 133 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,546 | 4 | 20,924 | 16 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,441 | 4 | 21,239 | 85 |
| review:conventions | claude-opus-5-5 | 5 | 2,425 | 10 | 128,276 | 27 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,204 | 4 | 18,101 | 16 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,798 | 4 | 21,259 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,774 | 4 | 21,253 | 9 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 1,018 | 4 | 21,275 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 988 | 4 | 21,264 | 20 |
| triage | claude-sonnet-5-5 | 2 | 920 | 4 | 19,577 | 12 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 661 | 4 | 21,245 | 166 |
| capture:provenance | claude-sonnet-5-5 | 2 | 339 | 4 | 16,897 | 9 |


wall: 351s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,546 | 20,924 | 16 | 17:38:39 | 17:38:56 |
| machine | 7 | 10,884 | 145,636 | 305 | 17:38:39 | 17:43:44 |
| review | 3 | 10,186 | 426,489 | 151 | 17:38:39 | 17:41:10 |
| triage | 1 | 920 | 19,577 | 12 | 17:43:44 | 17:43:56 |
| capture | 1 | 339 | 16,897 | 9 | 17:43:56 | 17:44:05 |
| synthesize | 1 | 3,625 | 27,289 | 25 | 17:44:05 | 17:44:31 |

- **claude-opus-5-5**: 3 agent · 16 calls · out 10,186 · in 36 · cache_read 426,489 · cache_create 125,696
- **claude-sonnet-5-5**: 4 agent · 8 calls · out 7,430 · in 16 · cache_read 84,687 · cache_create 109,478
- **claude-haiku-5-5**: 7 agent · 14 calls · out 10,884 · in 28 · cache_read 145,636 · cache_create 139,502

