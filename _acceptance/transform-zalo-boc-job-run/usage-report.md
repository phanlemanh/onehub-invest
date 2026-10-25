### S4 round 1 — wf_b9a6858a-a44 (15 agent, 39,962 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 10 | 8,117 | 20 | 395,474 | 92 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,314 | 4 | 30,938 | 36 |
| review:measurement | claude-opus-5-5 | 4 | 4,246 | 8 | 83,006 | 46 |
| review:bugs | claude-opus-5-5 | 6 | 3,954 | 12 | 157,722 | 47 |
| triage | claude-sonnet-5-5 | 2 | 3,024 | 4 | 20,551 | 22 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,170 | 4 | 20,135 | 12 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,106 | 4 | 20,139 | 17 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,051 | 4 | 19,081 | 13 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,808 | 4 | 20,153 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,605 | 4 | 20,147 | 8 |
| refute:zalo-import-job.test.mjs | claude-sonnet-5-5 | 3 | 1,503 | 6 | 39,383 | 15 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,033 | 4 | 20,158 | 13 |
| machine:node --test scripts/zalo-import-job.test | claude-haiku-5-5 | 2 | 962 | 4 | 20,155 | 8 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 716 | 4 | 20,133 | 28 |
| capture:provenance | claude-sonnet-5-5 | 2 | 353 | 4 | 18,790 | 5 |


wall: 181s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,051 | 19,081 | 13 | 06:03:48 | 06:04:02 |
| machine | 7 | 10,400 | 141,020 | 95 | 06:03:48 | 06:05:24 |
| review | 3 | 16,317 | 636,202 | 92 | 06:03:48 | 06:05:21 |
| triage | 1 | 3,024 | 20,551 | 22 | 06:05:25 | 06:05:47 |
| refute | 1 | 1,503 | 39,383 | 15 | 06:05:49 | 06:06:04 |
| capture | 1 | 353 | 18,790 | 5 | 06:06:07 | 06:06:12 |
| synthesize | 1 | 6,314 | 30,938 | 36 | 06:06:14 | 06:06:49 |

- **claude-opus-5-5**: 3 agent · 20 calls · out 16,317 · in 40 · cache_read 636,202 · cache_create 130,133
- **claude-sonnet-5-5**: 5 agent · 11 calls · out 13,245 · in 22 · cache_read 128,743 · cache_create 126,642
- **claude-haiku-5-5**: 7 agent · 14 calls · out 10,400 · in 28 · cache_read 141,020 · cache_create 128,067

