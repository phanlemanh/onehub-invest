### S4 round 1 — wf_8e878766-23f (16 agent, 47,654 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 6 | 7,595 | 12 | 195,411 | 88 |
| review:measurement | claude-opus-5-5 | 4 | 7,056 | 8 | 90,981 | 72 |
| review:conventions | claude-opus-5-5 | 12 | 6,247 | 24 | 462,137 | 72 |
| review:bugs | claude-opus-5-5 | 12 | 6,093 | 24 | 411,991 | 64 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,435 | 4 | 21,360 | 25 |
| triage | claude-sonnet-5-5 | 2 | 2,921 | 4 | 20,977 | 22 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,670 | 4 | 20,822 | 34 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,170 | 4 | 20,828 | 27 |
| machine:cd pipeline && node --test scripts/nap-l | claude-haiku-5-5 | 2 | 1,840 | 4 | 20,851 | 9 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,700 | 4 | 20,842 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,697 | 4 | 20,836 | 9 |
| machine:cd pipeline && node --test scripts/airbn | claude-haiku-5-5 | 2 | 1,204 | 4 | 20,854 | 10 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,141 | 4 | 20,847 | 16 |
| machine:cd pipeline && node --test scripts/airbn | claude-haiku-5-5 | 2 | 904 | 4 | 20,853 | 6 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 539 | 4 | 20,824 | 7 |
| capture:provenance | claude-sonnet-5-5 | 2 | 442 | 4 | 19,488 | 5 |


wall: 217s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,435 | 21,360 | 25 | 01:15:13 | 01:15:38 |
| machine | 9 | 13,865 | 187,557 | 101 | 01:15:13 | 01:16:54 |
| review | 3 | 19,396 | 965,109 | 73 | 01:15:13 | 01:16:26 |
| triage | 1 | 2,921 | 20,977 | 22 | 01:16:54 | 01:17:17 |
| capture | 1 | 442 | 19,488 | 5 | 01:17:17 | 01:17:22 |
| synthesize | 1 | 7,595 | 195,411 | 88 | 01:17:22 | 01:18:51 |

- **claude-sonnet-5-5**: 4 agent · 12 calls · out 14,393 · in 24 · cache_read 257,236 · cache_create 109,207
- **claude-opus-5-5**: 3 agent · 28 calls · out 19,396 · in 56 · cache_read 965,109 · cache_create 137,821
- **claude-haiku-5-5**: 9 agent · 18 calls · out 13,865 · in 36 · cache_read 187,557 · cache_create 169,980

