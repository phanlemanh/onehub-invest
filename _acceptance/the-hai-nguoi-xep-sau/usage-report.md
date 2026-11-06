### S4 round 1 — wf_d5c0d2fb-6ba (20 agent, 67,361 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 9 | 10,082 | 20 | 405,297 | 108 |
| review:bugs | claude-opus-5-5 | 14 | 7,546 | 30 | 661,335 | 87 |
| machine:cd app && npm test | claude-haiku-5-5 | 11 | 6,408 | 22 | 261,418 | 1319 |
| review:conventions | claude-opus-5-5 | 9 | 6,387 | 18 | 336,548 | 64 |
| synthesize:report | claude-sonnet-5-5 | 5 | 6,274 | 10 | 163,358 | 54 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 5,940 | 6 | 64,606 | 57 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 3,132 | 4 | 25,244 | 27 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,850 | 4 | 22,079 | 32 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,547 | 4 | 25,223 | 252 |
| triage | claude-sonnet-5-5 | 2 | 2,418 | 4 | 25,153 | 19 |
| refute:lat-that.mjs | claude-sonnet-5-5 | 4 | 2,175 | 8 | 73,859 | 22 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,096 | 4 | 25,237 | 10 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,852 | 4 | 25,231 | 8 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 1,462 | 4 | 25,240 | 9 |
| machine:bash _acceptance/the-hai-nguoi-xep-sau/p | claude-haiku-5-5 | 2 | 1,254 | 4 | 25,263 | 7 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,245 | 4 | 25,242 | 18 |
| machine:bash -o pipefail -c 'cd app && node --im | claude-haiku-5-5 | 2 | 1,159 | 4 | 25,305 | 9 |
| machine:cd app && node --import tsx ../_acceptan | claude-haiku-5-5 | 2 | 1,081 | 4 | 25,264 | 10 |
| machine:cd app && node --import tsx ../_acceptan | claude-haiku-5-5 | 2 | 1,042 | 4 | 25,265 | 11 |
| capture:provenance | claude-sonnet-5-5 | 2 | 411 | 4 | 20,876 | 6 |


wall: 1760s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 5,940 | 64,606 | 57 | 05:19:49 | 05:20:46 |
| machine | 12 | 26,128 | 536,011 | 1650 | 05:19:49 | 05:47:19 |
| review | 3 | 24,015 | 1,403,180 | 109 | 05:19:49 | 05:21:38 |
| triage | 1 | 2,418 | 25,153 | 19 | 05:47:22 | 05:47:41 |
| refute | 1 | 2,175 | 73,859 | 22 | 05:47:43 | 05:48:05 |
| capture | 1 | 411 | 20,876 | 6 | 05:48:07 | 05:48:13 |
| synthesize | 1 | 6,274 | 163,358 | 54 | 05:48:16 | 05:49:09 |

- **claude-opus-5-5**: 3 agent · 32 calls · out 24,015 · in 68 · cache_read 1,403,180 · cache_create 213,872
- **claude-haiku-5-5**: 12 agent · 33 calls · out 26,128 · in 66 · cache_read 536,011 · cache_create 310,672
- **claude-sonnet-5-5**: 5 agent · 16 calls · out 17,218 · in 32 · cache_read 347,852 · cache_create 167,856


### S4 round 2 — wf_bd8819cf-172 (14 agent, 36,823 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:cd app && npm test | claude-haiku-5-5 | 13 | 7,428 | 26 | 345,197 | 1309 |
| synthesize:report | claude-sonnet-5-5 | 4 | 6,502 | 8 | 118,061 | 52 |
| review:measurement | claude-opus-5-5 | 4 | 3,005 | 8 | 82,791 | 32 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 2,980 | 6 | 56,287 | 30 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,898 | 4 | 25,232 | 32 |
| review:bugs | claude-opus-5-5 | 4 | 2,423 | 8 | 80,935 | 26 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,312 | 4 | 25,236 | 252 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,296 | 4 | 25,250 | 10 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,979 | 4 | 25,244 | 9 |
| triage | claude-sonnet-5-5 | 2 | 1,586 | 4 | 24,336 | 14 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,308 | 4 | 25,255 | 16 |
| review:conventions | claude-opus-5-5 | 3 | 896 | 6 | 47,692 | 10 |
| machine:cd app && node --import tsx ../_acceptan | claude-haiku-5-5 | 2 | 879 | 4 | 25,278 | 7 |
| capture:provenance | claude-sonnet-5-5 | 2 | 331 | 4 | 20,889 | 8 |


wall: 1719s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,980 | 56,287 | 30 | 05:51:00 | 05:51:30 |
| machine | 7 | 19,100 | 496,692 | 1639 | 05:51:00 | 06:18:19 |
| review | 3 | 6,324 | 211,418 | 33 | 05:51:00 | 05:51:33 |
| triage | 1 | 1,586 | 24,336 | 14 | 06:18:21 | 06:18:35 |
| capture | 1 | 331 | 20,889 | 8 | 06:18:37 | 06:18:45 |
| synthesize | 1 | 6,502 | 118,061 | 52 | 06:18:47 | 06:19:39 |

- **claude-haiku-5-5**: 7 agent · 25 calls · out 19,100 · in 50 · cache_read 496,692 · cache_create 196,965
- **claude-sonnet-5-5**: 4 agent · 11 calls · out 11,399 · in 22 · cache_read 219,573 · cache_create 131,462
- **claude-opus-5-5**: 3 agent · 11 calls · out 6,324 · in 22 · cache_read 211,418 · cache_create 98,050

