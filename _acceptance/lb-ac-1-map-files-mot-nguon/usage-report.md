### S4 round 1 — wf_399a9e85-a02 (14 agent, 36,057 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 2 | 5,029 | 4 | 25,762 | 34 |
| review:measurement | claude-opus-5-5 | 7 | 4,205 | 14 | 184,047 | 46 |
| review:bugs | claude-opus-5-5 | 5 | 4,057 | 10 | 109,435 | 44 |
| review:conventions | claude-opus-5-5 | 6 | 3,964 | 12 | 142,414 | 45 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,696 | 4 | 20,738 | 23 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,570 | 4 | 17,888 | 56 |
| machine:node --test scripts/don-hex-tho.test.mjs | claude-haiku-5-5 | 2 | 2,378 | 4 | 20,948 | 11 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,260 | 4 | 20,928 | 39 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,073 | 4 | 20,942 | 10 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,072 | 4 | 20,924 | 15 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,941 | 4 | 20,936 | 10 |
| triage | claude-sonnet-5-5 | 2 | 1,356 | 4 | 19,829 | 14 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,133 | 4 | 20,947 | 16 |
| capture:provenance | claude-sonnet-5-5 | 2 | 323 | 4 | 16,687 | 10 |


wall: 202s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,696 | 20,738 | 23 | 10:15:03 | 10:15:27 |
| machine | 7 | 14,427 | 143,513 | 145 | 10:15:03 | 10:17:29 |
| review | 3 | 12,226 | 435,896 | 47 | 10:15:03 | 10:15:51 |
| triage | 1 | 1,356 | 19,829 | 14 | 10:17:29 | 10:17:42 |
| capture | 1 | 323 | 16,687 | 10 | 10:17:42 | 10:17:52 |
| synthesize | 1 | 5,029 | 25,762 | 34 | 10:17:52 | 10:18:26 |

- **claude-sonnet-5-5**: 4 agent · 8 calls · out 9,404 · in 16 · cache_read 83,016 · cache_create 107,642
- **claude-opus-5-5**: 3 agent · 18 calls · out 12,226 · in 36 · cache_read 435,896 · cache_create 99,199
- **claude-haiku-5-5**: 7 agent · 14 calls · out 14,427 · in 28 · cache_read 143,513 · cache_create 140,386

