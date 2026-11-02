### S4 round 1 — wf_a69b8d44-c41 (32 agent, 170,679 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 8 | 31,298 | 20 | 621,051 | 302 |
| review:bugs | claude-opus-5-5 | 9 | 29,561 | 20 | 662,967 | 302 |
| review:measurement | claude-opus-5-5 | 6 | 28,618 | 12 | 498,182 | 284 |
| synthesize:report | claude-sonnet-5-5 | 2 | 15,869 | 4 | 45,507 | 86 |
| triage | claude-sonnet-5-5 | 2 | 11,366 | 4 | 31,712 | 74 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,826 | 6 | 55,339 | 37 |
| refute:vlm-anh.test.mjs | claude-sonnet-5-5 | 8 | 3,438 | 16 | 192,196 | 39 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 3,377 | 4 | 22,225 | 61 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,978 | 4 | 19,094 | 27 |
| refute:vlm-anh.test.mjs | claude-sonnet-5-5 | 6 | 2,877 | 12 | 129,526 | 32 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,507 | 4 | 22,231 | 203 |
| machine:cd agent && node --import tsx --test tes | claude-haiku-5-5 | 2 | 2,366 | 4 | 22,266 | 37 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,324 | 4 | 22,245 | 10 |
| refute:vlm-anh.test.mjs | claude-sonnet-5-5 | 8 | 2,302 | 16 | 184,205 | 30 |
| refute:vlm-anh.test.mjs | claude-sonnet-5-5 | 7 | 2,142 | 14 | 146,635 | 29 |
| refute:vlm-anh-s03-db.itest.ts | claude-sonnet-5-5 | 3 | 2,086 | 6 | 46,721 | 23 |
| refute:vlm-anh-s03-db.itest.ts | claude-sonnet-5-5 | 5 | 1,972 | 10 | 103,546 | 21 |
| machine:node --test pipeline/tests/vlm-anh.test. | claude-haiku-5-5 | 2 | 1,919 | 4 | 22,261 | 10 |
| refute:vlm-anh-s03-db.itest.ts | claude-sonnet-5-5 | 6 | 1,890 | 12 | 130,513 | 26 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,889 | 4 | 22,239 | 10 |
| refute:vlm-anh-s03-db.itest.ts | claude-sonnet-5-5 | 5 | 1,726 | 10 | 120,251 | 20 |
| refute:vlm-anh.test.mjs | claude-sonnet-5-5 | 4 | 1,709 | 8 | 67,601 | 21 |
| machine:cd agent && node --import tsx --test tes | claude-haiku-5-5 | 2 | 1,632 | 4 | 22,263 | 9 |
| refute:vlm-anh.test.mjs | claude-sonnet-5-5 | 4 | 1,615 | 8 | 71,934 | 19 |
| machine:"node pipeline/vlm-anh-s03.mjs --dem --k | claude-haiku-5-5 | 2 | 1,380 | 4 | 22,276 | 11 |
| refute:vlm-anh.test.mjs | claude-sonnet-5-5 | 4 | 1,368 | 8 | 85,778 | 16 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,292 | 4 | 22,250 | 15 |
| judge:E9:spec-alignment | claude-sonnet-5-5 | 2 | 1,144 | 4 | 22,238 | 10 |
| judge:E9:domain-correctness | claude-sonnet-5-5 | 2 | 1,080 | 4 | 18,733 | 10 |
| judge:E9:operational-feasibility | claude-sonnet-5-5 | 2 | 914 | 4 | 22,240 | 8 |
| refute:vlm-anh.mjs | claude-sonnet-5-5 | 3 | 864 | 6 | 40,164 | 12 |
| capture:provenance | claude-sonnet-5-5 | 2 | 350 | 4 | 17,891 | 6 |


wall: 553s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,826 | 55,339 | 37 | 03:05:17 | 03:05:54 |
| machine | 10 | 21,664 | 219,350 | 337 | 03:05:17 | 03:10:54 |
| judge | 3 | 3,138 | 63,211 | 11 | 03:05:17 | 03:05:28 |
| review | 3 | 89,477 | 1,782,200 | 302 | 03:05:17 | 03:10:20 |
| triage | 1 | 11,366 | 31,712 | 74 | 03:10:56 | 03:12:10 |
| refute | 12 | 23,989 | 1,319,070 | 42 | 03:12:12 | 03:12:54 |
| capture | 1 | 350 | 17,891 | 6 | 03:12:56 | 03:13:02 |
| synthesize | 1 | 15,869 | 45,507 | 86 | 03:13:04 | 03:14:30 |

- **claude-opus-5-5**: 3 agent · 23 calls · out 89,477 · in 52 · cache_read 1,782,200 · cache_create 402,407
- **claude-sonnet-5-5**: 19 agent · 78 calls · out 59,538 · in 156 · cache_read 1,532,730 · cache_create 567,413
- **claude-haiku-5-5**: 10 agent · 20 calls · out 21,664 · in 40 · cache_read 219,350 · cache_create 207,878

