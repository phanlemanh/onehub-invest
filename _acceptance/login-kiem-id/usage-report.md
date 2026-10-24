### S4 round 1 — wf_ee218693-9dc (12 agent, 35,058 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 6 | 6,011 | 12 | 177,148 | 77 |
| review:bugs | claude-opus-5-5 | 12 | 5,516 | 24 | 508,261 | 75 |
| synthesize:report | claude-sonnet-5-5 | 4 | 5,400 | 8 | 92,557 | 37 |
| review:conventions | claude-opus-5-5 | 9 | 4,811 | 18 | 380,559 | 72 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,537 | 4 | 16,851 | 22 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,208 | 4 | 19,914 | 17 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 1,882 | 4 | 18,710 | 23 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,744 | 4 | 19,922 | 9 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,732 | 4 | 19,910 | 9 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,603 | 4 | 19,928 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,187 | 4 | 19,933 | 11 |
| capture:provenance | claude-sonnet-5-5 | 2 | 427 | 4 | 15,649 | 6 |


wall: 133s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 1,882 | 18,710 | 23 | 10:36:23 | 10:36:46 |
| machine | 6 | 11,011 | 116,458 | 86 | 10:36:23 | 10:37:49 |
| review | 3 | 16,338 | 1,065,968 | 79 | 10:36:23 | 10:37:42 |
| capture | 1 | 427 | 15,649 | 6 | 10:37:51 | 10:37:57 |
| synthesize | 1 | 5,400 | 92,557 | 37 | 10:37:59 | 10:38:36 |

- **claude-opus-5-5**: 3 agent · 27 calls · out 16,338 · in 54 · cache_read 1,065,968 · cache_create 175,719
- **claude-sonnet-5-5**: 3 agent · 8 calls · out 7,709 · in 16 · cache_read 126,916 · cache_create 77,567
- **claude-haiku-5-5**: 6 agent · 12 calls · out 11,011 · in 24 · cache_read 116,458 · cache_create 112,088

