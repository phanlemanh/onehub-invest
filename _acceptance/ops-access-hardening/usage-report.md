### S4 round 1 — wf_8cf09e93-de5 (10 agent, 40,993 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 16 | 8,652 | 32 | 561,177 | 105 |
| review:measurement | claude-opus-5-5 | 6 | 7,920 | 12 | 143,415 | 82 |
| review:conventions | claude-opus-5-5 | 11 | 7,038 | 22 | 358,964 | 72 |
| synthesize:report | claude-sonnet-5-5 | 3 | 6,492 | 6 | 60,258 | 45 |
| triage | claude-sonnet-5-5 | 2 | 3,344 | 4 | 16,965 | 33 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,135 | 4 | 15,815 | 28 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,869 | 4 | 15,849 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,399 | 4 | 15,854 | 16 |
| machine:BASE_URL=http://localhost:3456 node scri | claude-haiku-5-5 | 2 | 729 | 4 | 15,869 | 8 |
| capture:provenance | claude-sonnet-5-5 | 2 | 415 | 4 | 11,659 | 12 |


wall: 196s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,135 | 15,815 | 28 | 15:25:29 | 15:25:58 |
| machine | 3 | 3,997 | 47,572 | 25 | 15:25:30 | 15:25:54 |
| review | 3 | 23,610 | 1,063,556 | 105 | 15:25:30 | 15:27:15 |
| triage | 1 | 3,344 | 16,965 | 33 | 15:27:15 | 15:27:48 |
| capture | 1 | 415 | 11,659 | 12 | 15:27:48 | 15:28:00 |
| synthesize | 1 | 6,492 | 60,258 | 45 | 15:28:00 | 15:28:45 |

- **claude-opus-5-5**: 3 agent · 33 calls · out 23,610 · in 66 · cache_read 1,063,556 · cache_create 149,203
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 13,386 · in 18 · cache_read 104,697 · cache_create 102,394
- **claude-haiku-5-5**: 3 agent · 6 calls · out 3,997 · in 12 · cache_read 47,572 · cache_create 47,068

