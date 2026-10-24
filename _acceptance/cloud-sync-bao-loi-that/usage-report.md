### S4 round 1 — wf_3dad84dd-8a2 — wf_3dad84dd-8a2 (16 agent, 32,837 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 4 | 5,523 | 8 | 97,914 | 37 |
| review:measurement | claude-opus-5-5 | 5 | 3,972 | 10 | 129,935 | 57 |
| review:bugs | claude-opus-5-5 | 10 | 3,812 | 20 | 314,772 | 60 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,233 | 4 | 20,370 | 9 |
| review:conventions | claude-opus-5-5 | 6 | 2,139 | 12 | 168,997 | 44 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 1,948 | 4 | 20,376 | 14 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 1,902 | 4 | 19,189 | 21 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,720 | 4 | 20,390 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,678 | 4 | 20,384 | 7 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,569 | 4 | 17,315 | 8 |
| judge:E6:operational-feasibility | claude-sonnet-5-5 | 2 | 1,544 | 4 | 20,891 | 11 |
| judge:E6:domain-correctness | claude-sonnet-5-5 | 3 | 1,510 | 6 | 52,113 | 13 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,294 | 4 | 20,395 | 12 |
| judge:E6:spec-alignment | claude-sonnet-5-5 | 2 | 979 | 4 | 20,889 | 8 |
| machine:node --test scripts/*.test.mjs | claude-haiku-5-5 | 2 | 687 | 4 | 20,384 | 14 |
| capture:provenance | claude-sonnet-5-5 | 2 | 327 | 4 | 16,114 | 5 |


wall: 107s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 1,902 | 19,189 | 21 | 05:57:58 | 05:58:20 |
| machine | 7 | 11,129 | 139,614 | 59 | 05:57:58 | 05:58:57 |
| judge | 3 | 4,033 | 93,893 | 13 | 05:57:58 | 05:58:12 |
| review | 3 | 9,923 | 613,704 | 65 | 05:57:58 | 05:59:03 |
| capture | 1 | 327 | 16,114 | 5 | 05:59:03 | 05:59:08 |
| synthesize | 1 | 5,523 | 97,914 | 37 | 05:59:08 | 05:59:45 |

- **claude-sonnet-5-5**: 6 agent · 15 calls · out 11,785 · in 30 · cache_read 227,110 · cache_create 186,108
- **claude-opus-5-5**: 3 agent · 21 calls · out 9,923 · in 42 · cache_read 613,704 · cache_create 146,382
- **claude-haiku-5-5**: 7 agent · 14 calls · out 11,129 · in 28 · cache_read 139,614 · cache_create 147,824

