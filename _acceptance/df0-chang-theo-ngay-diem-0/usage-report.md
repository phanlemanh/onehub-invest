### S4 wf_51a9ab02-e41 — wf_51a9ab02-e41 (18 agent, 46,088 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| ui:E7 | claude-sonnet-5-5 | 16 | 9,769 | 32 | 1,336,661 | 178 |
| synthesize:report | claude-sonnet-5-5 | 6 | 9,564 | 12 | 199,487 | 62 |
| review:measurement | claude-opus-5-5 | 5 | 5,579 | 10 | 116,043 | 66 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,671 | 4 | 20,528 | 16 |
| review:bugs | claude-opus-5-5 | 8 | 2,124 | 16 | 226,987 | 34 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,111 | 4 | 21,119 | 33 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 1,964 | 4 | 21,082 | 55 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,863 | 4 | 18,027 | 15 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,583 | 4 | 21,127 | 8 |
| triage | claude-sonnet-5-5 | 2 | 1,408 | 4 | 19,891 | 12 |
| review:conventions | claude-opus-5-5 | 4 | 1,162 | 8 | 85,461 | 19 |
| judge:E6:spec-alignment | claude-sonnet-5-5 | 2 | 1,095 | 4 | 21,449 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,075 | 4 | 21,107 | 22 |
| judge:E6:operational-feasibility | claude-sonnet-5-5 | 2 | 1,049 | 4 | 21,451 | 9 |
| judge:E6:domain-correctness | claude-sonnet-5-5 | 2 | 1,040 | 4 | 17,921 | 9 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 896 | 4 | 21,133 | 6 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 691 | 4 | 21,115 | 7 |
| capture:provenance | claude-sonnet-5-5 | 2 | 444 | 4 | 16,865 | 5 |


wall: 258s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,671 | 20,528 | 16 | 23:56:08 | 23:56:24 |
| machine | 7 | 10,183 | 144,710 | 137 | 23:56:08 | 23:58:25 |
| ui | 1 | 9,769 | 1,336,661 | 178 | 23:56:08 | 23:59:06 |
| judge | 3 | 3,184 | 60,821 | 10 | 23:56:08 | 23:56:18 |
| review | 3 | 8,865 | 428,491 | 69 | 23:56:08 | 23:57:17 |
| triage | 1 | 1,408 | 19,891 | 12 | 23:59:06 | 23:59:18 |
| capture | 1 | 444 | 16,865 | 5 | 23:59:18 | 23:59:23 |
| synthesize | 1 | 9,564 | 199,487 | 62 | 23:59:23 | 00:00:26 |

- **claude-sonnet-5-5**: 8 agent · 34 calls · out 27,040 · in 68 · cache_read 1,654,253 · cache_create 307,623
- **claude-opus-5-5**: 3 agent · 17 calls · out 8,865 · in 34 · cache_read 428,491 · cache_create 119,535
- **claude-haiku-5-5**: 7 agent · 14 calls · out 10,183 · in 28 · cache_read 144,710 · cache_create 137,725

### S4 wf_58b81a7a-1da — wf_58b81a7a-1da (14 agent, 26,632 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 5 | 7,847 | 10 | 166,018 | 57 |
| review:measurement | claude-opus-5-5 | 7 | 2,504 | 14 | 201,933 | 36 |
| review:bugs | claude-opus-5-5 | 8 | 2,178 | 16 | 190,743 | 44 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,088 | 4 | 20,929 | 26 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,896 | 4 | 20,925 | 12 |
| review:conventions | claude-opus-5-5 | 6 | 1,750 | 12 | 117,293 | 25 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,715 | 4 | 20,937 | 8 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 1,499 | 4 | 20,923 | 40 |
| judge:E6:operational-feasibility | claude-sonnet-5-5 | 2 | 1,168 | 4 | 21,292 | 12 |
| judge:E6:domain-correctness | claude-sonnet-5-5 | 2 | 1,042 | 4 | 17,762 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 969 | 4 | 20,948 | 16 |
| judge:E6:spec-alignment | claude-sonnet-5-5 | 2 | 944 | 4 | 21,290 | 8 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 672 | 4 | 20,943 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 360 | 4 | 19,589 | 7 |


wall: 170s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 6 | 8,839 | 125,605 | 106 | 00:02:01 | 00:03:47 |
| judge | 3 | 3,154 | 60,344 | 13 | 00:02:01 | 00:02:14 |
| review | 3 | 6,432 | 509,969 | 46 | 00:02:01 | 00:02:47 |
| capture | 1 | 360 | 19,589 | 7 | 00:03:47 | 00:03:53 |
| synthesize | 1 | 7,847 | 166,018 | 57 | 00:03:53 | 00:04:51 |

- **claude-sonnet-5-5**: 5 agent · 13 calls · out 11,361 · in 26 · cache_read 245,951 · cache_create 149,262
- **claude-opus-5-5**: 3 agent · 21 calls · out 6,432 · in 42 · cache_read 509,969 · cache_create 106,302
- **claude-haiku-5-5**: 6 agent · 12 calls · out 8,839 · in 24 · cache_read 125,605 · cache_create 113,795

### S4 wf_63544bbc-b4b — wf_63544bbc-b4b (13 agent, 37,597 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| ui:E7 | claude-sonnet-5-5 | 25 | 15,808 | 50 | 2,304,388 | 212 |
| synthesize:report | claude-sonnet-5-5 | 5 | 6,658 | 10 | 140,707 | 52 |
| review:measurement | claude-opus-5-5 | 7 | 2,710 | 14 | 189,100 | 38 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,098 | 4 | 20,889 | 25 |
| review:bugs | claude-opus-5-5 | 8 | 1,979 | 16 | 192,063 | 45 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,765 | 4 | 20,885 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,739 | 4 | 20,897 | 8 |
| review:conventions | claude-opus-5-5 | 5 | 1,274 | 10 | 90,843 | 21 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,051 | 4 | 20,908 | 15 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 751 | 4 | 20,883 | 30 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 733 | 4 | 20,916 | 6 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 590 | 4 | 20,903 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 441 | 4 | 16,744 | 8 |


wall: 273s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 7 | 8,727 | 146,281 | 91 | 00:06:23 | 00:07:54 |
| ui | 1 | 15,808 | 2,304,388 | 212 | 00:06:23 | 00:09:56 |
| review | 3 | 5,963 | 472,006 | 45 | 00:06:23 | 00:07:09 |
| capture | 1 | 441 | 16,744 | 8 | 00:09:56 | 00:10:04 |
| synthesize | 1 | 6,658 | 140,707 | 52 | 00:10:04 | 00:10:56 |

- **claude-sonnet-5-5**: 3 agent · 32 calls · out 22,907 · in 64 · cache_read 2,461,839 · cache_create 179,334
- **claude-opus-5-5**: 3 agent · 20 calls · out 5,963 · in 40 · cache_read 472,006 · cache_create 98,787
- **claude-haiku-5-5**: 7 agent · 14 calls · out 8,727 · in 28 · cache_read 146,281 · cache_create 133,926

