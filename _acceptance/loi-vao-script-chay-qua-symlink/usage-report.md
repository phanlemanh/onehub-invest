### S4 round 1 — wf_f696e61a-960 (13 agent, 47,987 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 13 | 8,804 | 26 | 483,270 | 91 |
| review:measurement | claude-opus-5-5 | 9 | 8,775 | 18 | 309,802 | 88 |
| review:bugs | claude-opus-5-5 | 15 | 8,176 | 30 | 626,000 | 90 |
| synthesize:report | claude-sonnet-5-5 | 3 | 5,835 | 6 | 68,669 | 35 |
| triage | claude-sonnet-5-5 | 2 | 3,287 | 4 | 20,745 | 25 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,434 | 4 | 19,433 | 10 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,118 | 4 | 16,382 | 14 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 1,902 | 4 | 18,254 | 18 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,809 | 4 | 19,453 | 8 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,591 | 4 | 19,435 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,528 | 4 | 19,447 | 7 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,304 | 4 | 19,458 | 12 |
| capture:provenance | claude-sonnet-5-5 | 2 | 424 | 4 | 15,176 | 5 |


wall: 157s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 1,902 | 18,254 | 18 | 17:26:37 | 17:26:55 |
| machine | 6 | 10,784 | 113,608 | 60 | 17:26:37 | 17:27:38 |
| review | 3 | 25,755 | 1,419,072 | 91 | 17:26:37 | 17:28:09 |
| triage | 1 | 3,287 | 20,745 | 25 | 17:28:09 | 17:28:34 |
| capture | 1 | 424 | 15,176 | 5 | 17:28:34 | 17:28:39 |
| synthesize | 1 | 5,835 | 68,669 | 35 | 17:28:39 | 17:29:14 |

- **claude-opus-5-5**: 3 agent · 37 calls · out 25,755 · in 74 · cache_read 1,419,072 · cache_create 155,433
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 11,448 · in 18 · cache_read 122,844 · cache_create 114,577
- **claude-haiku-5-5**: 6 agent · 12 calls · out 10,784 · in 24 · cache_read 113,608 · cache_create 121,068

