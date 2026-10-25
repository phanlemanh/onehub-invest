### S4 round 1 — wf_5ddad61b-755 (15 agent, 40,969 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 9 | 7,645 | 18 | 294,494 | 82 |
| review:measurement | claude-opus-5-5 | 3 | 6,271 | 6 | 46,010 | 62 |
| synthesize:report | claude-sonnet-5-5 | 3 | 5,890 | 6 | 65,742 | 35 |
| review:bugs | claude-opus-5-5 | 9 | 5,700 | 18 | 235,222 | 66 |
| triage | claude-sonnet-5-5 | 2 | 2,795 | 4 | 20,641 | 21 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,610 | 4 | 19,667 | 16 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 1,987 | 4 | 20,176 | 17 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,852 | 4 | 20,190 | 8 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,724 | 4 | 17,115 | 9 |
| machine:node --test scripts/zalo-import-job.test | claude-haiku-5-5 | 2 | 1,174 | 4 | 20,192 | 7 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,018 | 4 | 20,195 | 12 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 751 | 4 | 20,170 | 27 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 593 | 4 | 20,184 | 5 |
| machine:node --test scripts/zalo-import-job-lan. | claude-haiku-5-5 | 2 | 548 | 4 | 20,197 | 9 |
| capture:provenance | claude-sonnet-5-5 | 2 | 411 | 4 | 15,913 | 4 |


wall: 142s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,610 | 19,667 | 16 | 07:49:02 | 07:49:18 |
| machine | 8 | 9,647 | 158,419 | 78 | 07:49:02 | 07:50:20 |
| review | 3 | 19,616 | 575,726 | 82 | 07:49:02 | 07:50:23 |
| triage | 1 | 2,795 | 20,641 | 21 | 07:50:23 | 07:50:45 |
| capture | 1 | 411 | 15,913 | 4 | 07:50:45 | 07:50:49 |
| synthesize | 1 | 5,890 | 65,742 | 35 | 07:50:49 | 07:51:24 |

- **claude-opus-5-5**: 3 agent · 21 calls · out 19,616 · in 42 · cache_read 575,726 · cache_create 114,902
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 11,706 · in 18 · cache_read 121,963 · cache_create 110,417
- **claude-haiku-5-5**: 8 agent · 16 calls · out 9,647 · in 32 · cache_read 158,419 · cache_create 148,695

