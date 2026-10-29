### S4 round 1 — wf_2113b21d-b01 (23 agent, 82,293 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 8 | 12,084 | 16 | 265,881 | 127 |
| review:conventions | claude-opus-5-5 | 19 | 11,590 | 38 | 1,107,978 | 119 |
| synthesize:report | claude-sonnet-5-5 | 4 | 10,066 | 8 | 132,506 | 73 |
| review:measurement | claude-opus-5-5 | 5 | 9,877 | 10 | 122,669 | 101 |
| triage | claude-sonnet-5-5 | 2 | 6,782 | 4 | 25,834 | 48 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 5,086 | 4 | 23,168 | 27 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,891 | 4 | 21,101 | 57 |
| machine:bash _acceptance/do-nen-hieu-nang/probes | claude-haiku-5-5 | 3 | 2,545 | 6 | 46,753 | 17 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,503 | 4 | 21,107 | 38 |
| refute:do.mjs | claude-sonnet-5-5 | 5 | 1,993 | 10 | 96,192 | 28 |
| refute:tai-lieu.mjs | claude-sonnet-5-5 | 4 | 1,965 | 8 | 69,336 | 27 |
| refute:khong-luat.mjs | claude-sonnet-5-5 | 3 | 1,929 | 6 | 42,145 | 20 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,920 | 4 | 21,121 | 8 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,836 | 4 | 17,963 | 11 |
| machine:bash _acceptance/do-nen-hieu-nang/probes | claude-haiku-5-5 | 2 | 1,389 | 4 | 21,140 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,313 | 4 | 21,126 | 25 |
| refute:thong-ke.mjs | claude-sonnet-5-5 | 3 | 1,260 | 6 | 41,578 | 13 |
| machine:node _acceptance/do-nen-hieu-nang/probes | claude-haiku-5-5 | 2 | 1,176 | 4 | 21,135 | 9 |
| machine:node _acceptance/do-nen-hieu-nang/probes | claude-haiku-5-5 | 2 | 1,157 | 4 | 21,139 | 7 |
| machine:node _acceptance/do-nen-hieu-nang/probes | claude-haiku-5-5 | 2 | 965 | 4 | 21,140 | 7 |
| machine:node _acceptance/do-nen-hieu-nang/probes | claude-haiku-5-5 | 2 | 793 | 4 | 21,139 | 6 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 745 | 4 | 21,115 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 428 | 4 | 16,761 | 9 |


wall: 303s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 5,086 | 23,168 | 27 | 08:04:12 | 08:04:39 |
| machine | 12 | 19,233 | 275,979 | 144 | 08:04:12 | 08:06:35 |
| review | 3 | 33,551 | 1,496,528 | 128 | 08:04:12 | 08:06:20 |
| triage | 1 | 6,782 | 25,834 | 48 | 08:06:35 | 08:07:24 |
| refute | 4 | 7,147 | 249,251 | 28 | 08:07:24 | 08:07:52 |
| capture | 1 | 428 | 16,761 | 9 | 08:07:52 | 08:08:02 |
| synthesize | 1 | 10,066 | 132,506 | 73 | 08:08:02 | 08:09:14 |

- **claude-opus-5-5**: 3 agent · 32 calls · out 33,551 · in 64 · cache_read 1,496,528 · cache_create 198,471
- **claude-sonnet-5-5**: 8 agent · 25 calls · out 29,509 · in 50 · cache_read 447,520 · cache_create 225,919
- **claude-haiku-5-5**: 12 agent · 25 calls · out 19,233 · in 50 · cache_read 275,979 · cache_create 236,602

