### S4 vòng 1 — wf_e8c6b5f8-878 (15 agent, 61,905 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 28 | 14,688 | 56 | 1,790,858 | 184 |
| review:bugs | claude-opus-5-5 | 21 | 11,205 | 42 | 1,099,265 | 142 |
| review:measurement | claude-opus-5-5 | 6 | 11,039 | 12 | 183,640 | 117 |
| synthesize:report | claude-sonnet-5-5 | 3 | 6,671 | 6 | 71,220 | 37 |
| triage | claude-sonnet-5-5 | 2 | 3,654 | 4 | 21,359 | 25 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 3,001 | 4 | 19,852 | 43 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,164 | 4 | 19,992 | 18 |
| machine:node scripts/smoke-luong-7-ngay.mjs | claude-haiku-5-5 | 2 | 1,908 | 4 | 20,014 | 23 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,869 | 4 | 20,006 | 10 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,647 | 4 | 20,000 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,320 | 4 | 20,011 | 19 |
| machine:node scripts/luong-7-ngay-do.mjs | claude-haiku-5-5 | 2 | 1,024 | 4 | 20,010 | 7 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 818 | 4 | 19,988 | 8 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 573 | 4 | 16,929 | 27 |
| capture:provenance | claude-sonnet-5-5 | 2 | 324 | 4 | 15,727 | 5 |


wall: 257s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,001 | 19,852 | 43 | 02:14:46 | 02:15:29 |
| machine | 8 | 11,323 | 156,950 | 102 | 02:14:46 | 02:16:28 |
| review | 3 | 36,932 | 3,073,763 | 184 | 02:14:46 | 02:17:50 |
| triage | 1 | 3,654 | 21,359 | 25 | 02:17:52 | 02:18:17 |
| capture | 1 | 324 | 15,727 | 5 | 02:18:19 | 02:18:25 |
| synthesize | 1 | 6,671 | 71,220 | 37 | 02:18:27 | 02:19:04 |

- **claude-opus-5-5**: 3 agent · 55 calls · out 36,932 · in 110 · cache_read 3,073,763 · cache_create 250,692
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 13,650 · in 18 · cache_read 128,158 · cache_create 114,193
- **claude-haiku-5-5**: 8 agent · 16 calls · out 11,323 · in 32 · cache_read 156,950 · cache_create 148,026

