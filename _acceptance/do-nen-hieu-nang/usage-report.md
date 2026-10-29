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

### S4 round 2 — wf_e8de8899-9e3 (16 agent, 43,158 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 12 | 6,957 | 24 | 423,580 | 72 |
| review:conventions | claude-opus-5-5 | 13 | 6,817 | 26 | 429,200 | 65 |
| synthesize:report | claude-sonnet-5-5 | 3 | 5,975 | 6 | 68,513 | 46 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,838 | 4 | 20,994 | 17 |
| machine:bash _acceptance/do-nen-hieu-nang/probes | claude-haiku-5-5 | 3 | 2,727 | 6 | 46,958 | 15 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,710 | 4 | 21,120 | 56 |
| review:measurement | claude-opus-5-5 | 4 | 2,648 | 8 | 75,305 | 28 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,223 | 4 | 21,126 | 37 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,970 | 4 | 21,140 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,931 | 4 | 21,134 | 9 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,860 | 4 | 17,982 | 11 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,297 | 4 | 21,179 | 15 |
| machine:node _acceptance/do-nen-hieu-nang/probes | claude-haiku-5-5 | 2 | 1,246 | 4 | 21,158 | 8 |
| refute:s4-args.json | claude-sonnet-5-5 | 3 | 958 | 6 | 40,704 | 11 |
| triage | claude-sonnet-5-5 | 2 | 651 | 4 | 19,283 | 8 |
| capture:provenance | claude-sonnet-5-5 | 2 | 350 | 4 | 16,780 | 7 |


wall: 209s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,838 | 20,994 | 17 | 08:12:12 | 08:12:29 |
| machine | 8 | 15,964 | 191,797 | 138 | 08:12:12 | 08:14:30 |
| review | 3 | 16,422 | 928,085 | 73 | 08:12:12 | 08:13:25 |
| triage | 1 | 651 | 19,283 | 8 | 08:14:30 | 08:14:38 |
| refute | 1 | 958 | 40,704 | 11 | 08:14:38 | 08:14:48 |
| capture | 1 | 350 | 16,780 | 7 | 08:14:48 | 08:14:55 |
| synthesize | 1 | 5,975 | 68,513 | 46 | 08:14:55 | 08:15:41 |

- **claude-opus-5-5**: 3 agent · 29 calls · out 16,422 · in 58 · cache_read 928,085 · cache_create 133,780
- **claude-sonnet-5-5**: 5 agent · 12 calls · out 10,772 · in 24 · cache_read 166,274 · cache_create 149,049
- **claude-haiku-5-5**: 8 agent · 17 calls · out 15,964 · in 34 · cache_read 191,797 · cache_create 162,107

