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

### S4 round 2 — wf_f1592ffd-b31 (12 agent, 20,886 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 3 | 4,580 | 6 | 61,438 | 29 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,679 | 4 | 20,117 | 31 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,160 | 4 | 20,123 | 17 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,766 | 4 | 20,119 | 10 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,620 | 4 | 20,137 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,562 | 4 | 20,131 | 8 |
| review:measurement | claude-opus-5-5 | 4 | 1,548 | 8 | 70,192 | 21 |
| review:bugs | claude-opus-5-5 | 4 | 1,451 | 8 | 69,853 | 20 |
| machine:node --test scripts/zalo-import-job.test | claude-haiku-5-5 | 2 | 1,155 | 4 | 20,139 | 7 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,101 | 4 | 20,142 | 12 |
| review:conventions | claude-opus-5-5 | 3 | 932 | 6 | 39,546 | 14 |
| capture:provenance | claude-sonnet-5-5 | 2 | 332 | 4 | 18,774 | 5 |


wall: 134s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 7 | 12,043 | 140,908 | 96 | 06:08:48 | 06:10:24 |
| review | 3 | 3,931 | 179,591 | 21 | 06:08:48 | 06:09:09 |
| capture | 1 | 332 | 18,774 | 5 | 06:10:26 | 06:10:31 |
| synthesize | 1 | 4,580 | 61,438 | 29 | 06:10:33 | 06:11:02 |

- **claude-sonnet-5-5**: 2 agent · 5 calls · out 4,912 · in 10 · cache_read 80,212 · cache_create 57,033
- **claude-haiku-5-5**: 7 agent · 14 calls · out 12,043 · in 28 · cache_read 140,908 · cache_create 127,900
- **claude-opus-5-5**: 3 agent · 11 calls · out 3,931 · in 22 · cache_read 179,591 · cache_create 85,972

