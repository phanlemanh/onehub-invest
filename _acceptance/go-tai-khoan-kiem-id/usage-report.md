### S4 round 1 — wf_1fbeba41-41f (13 agent, 42,009 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 4 | 7,315 | 8 | 86,110 | 82 |
| synthesize:report | claude-sonnet-5-5 | 3 | 6,517 | 6 | 64,781 | 39 |
| review:bugs | claude-opus-5-5 | 9 | 6,291 | 18 | 333,868 | 75 |
| review:conventions | claude-opus-5-5 | 10 | 5,652 | 20 | 402,203 | 66 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,877 | 4 | 16,892 | 24 |
| triage | claude-sonnet-5-5 | 2 | 2,686 | 4 | 20,487 | 21 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,024 | 4 | 19,955 | 16 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 1,885 | 4 | 18,758 | 23 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,810 | 4 | 19,951 | 10 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,739 | 4 | 19,963 | 15 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,632 | 4 | 19,969 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,149 | 4 | 19,974 | 13 |
| capture:provenance | claude-sonnet-5-5 | 2 | 432 | 4 | 15,690 | 6 |


wall: 169s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 1,885 | 18,758 | 23 | 09:56:21 | 09:56:45 |
| machine | 6 | 11,231 | 116,704 | 97 | 09:56:21 | 09:57:58 |
| review | 3 | 19,258 | 822,181 | 83 | 09:56:21 | 09:57:44 |
| triage | 1 | 2,686 | 20,487 | 21 | 09:58:00 | 09:58:21 |
| capture | 1 | 432 | 15,690 | 6 | 09:58:23 | 09:58:29 |
| synthesize | 1 | 6,517 | 64,781 | 39 | 09:58:31 | 09:59:10 |

- **claude-opus-5-5**: 3 agent · 23 calls · out 19,258 · in 46 · cache_read 822,181 · cache_create 157,723
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 11,520 · in 18 · cache_read 119,716 · cache_create 107,150
- **claude-haiku-5-5**: 6 agent · 12 calls · out 11,231 · in 24 · cache_read 116,704 · cache_create 112,371

