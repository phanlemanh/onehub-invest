### S4 round 1 — wf_4a26ff05-c43 (25 agent, 84,440 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 20 | 13,190 | 40 | 1,104,306 | 196 |
| synthesize:report | claude-sonnet-5-5 | 4 | 11,834 | 8 | 120,720 | 74 |
| review:measurement | claude-opus-5-5 | 9 | 10,635 | 18 | 285,146 | 113 |
| review:conventions | claude-opus-5-5 | 15 | 7,509 | 30 | 625,147 | 83 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 7,004 | 4 | 23,140 | 255 |
| judge:E18:spec-alignment | claude-sonnet-5-5 | 4 | 3,477 | 8 | 88,726 | 34 |
| judge:E18:domain-correctness | claude-sonnet-5-5 | 4 | 3,455 | 8 | 88,272 | 30 |
| judge:E18:operational-feasibility | claude-sonnet-5-5 | 4 | 3,108 | 8 | 92,733 | 25 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 2,868 | 4 | 19,518 | 118 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,272 | 4 | 19,488 | 10 |
| triage | claude-sonnet-5-5 | 2 | 2,264 | 4 | 19,611 | 18 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,086 | 4 | 19,490 | 12 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,007 | 4 | 16,437 | 9 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,732 | 4 | 19,508 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,628 | 4 | 19,502 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,270 | 4 | 19,513 | 17 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 1,182 | 4 | 19,518 | 39 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 1,055 | 4 | 19,518 | 42 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 1,047 | 4 | 19,519 | 65 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 976 | 4 | 19,518 | 53 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 960 | 4 | 19,518 | 65 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 892 | 4 | 19,518 | 20 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 850 | 4 | 19,519 | 46 |
| machine:cd pipeline && node scripts/check-cloud- | claude-haiku-5-5 | 2 | 804 | 4 | 19,520 | 57 |
| capture:provenance | claude-sonnet-5-5 | 2 | 335 | 4 | 15,232 | 5 |


wall: 334s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 7,004 | 23,140 | 255 | 11:32:28 | 11:36:43 |
| machine | 15 | 21,629 | 289,604 | 120 | 11:32:28 | 11:34:28 |
| judge | 3 | 10,040 | 269,731 | 37 | 11:32:28 | 11:33:04 |
| review | 3 | 31,334 | 2,014,599 | 197 | 11:32:28 | 11:35:45 |
| triage | 1 | 2,264 | 19,611 | 18 | 11:35:45 | 11:36:03 |
| capture | 1 | 335 | 15,232 | 5 | 11:36:43 | 11:36:47 |
| synthesize | 1 | 11,834 | 120,720 | 74 | 11:36:47 | 11:38:01 |

- **claude-opus-5-5**: 3 agent · 44 calls · out 31,334 · in 88 · cache_read 2,014,599 · cache_create 197,187
- **claude-sonnet-5-5**: 7 agent · 22 calls · out 31,477 · in 44 · cache_read 448,434 · cache_create 250,516
- **claude-haiku-5-5**: 15 agent · 30 calls · out 21,629 · in 60 · cache_read 289,604 · cache_create 293,837

### S4 round 2 — wf_b7b2927d-a9a (15 agent, 43,874 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 7 | 14,191 | 14 | 284,137 | 96 |
| review:bugs | claude-opus-5-5 | 6 | 3,807 | 12 | 132,436 | 41 |
| review:conventions | claude-opus-5-5 | 4 | 3,440 | 8 | 68,924 | 36 |
| judge:E18:domain-correctness | claude-sonnet-5-5 | 4 | 2,847 | 8 | 87,689 | 23 |
| judge:E18:operational-feasibility | claude-sonnet-5-5 | 4 | 2,706 | 8 | 82,818 | 24 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,603 | 4 | 19,485 | 11 |
| judge:E18:spec-alignment | claude-sonnet-5-5 | 5 | 2,470 | 10 | 133,604 | 26 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,102 | 4 | 19,491 | 10 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,953 | 4 | 16,430 | 10 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,733 | 4 | 19,505 | 8 |
| triage | claude-sonnet-5-5 | 2 | 1,652 | 4 | 18,752 | 15 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,557 | 4 | 19,499 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,336 | 4 | 19,510 | 12 |
| review:measurement | claude-opus-5-5 | 3 | 1,067 | 6 | 41,605 | 12 |
| capture:provenance | claude-sonnet-5-5 | 2 | 410 | 4 | 18,143 | 9 |


wall: 179s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 6 | 11,284 | 113,920 | 58 | 11:40:22 | 11:41:21 |
| judge | 3 | 8,023 | 304,111 | 28 | 11:40:22 | 11:40:50 |
| review | 3 | 8,314 | 242,965 | 43 | 11:40:22 | 11:41:05 |
| triage | 1 | 1,652 | 18,752 | 15 | 11:41:21 | 11:41:36 |
| capture | 1 | 410 | 18,143 | 9 | 11:41:36 | 11:41:45 |
| synthesize | 1 | 14,191 | 284,137 | 96 | 11:41:45 | 11:43:21 |

- **claude-sonnet-5-5**: 6 agent · 24 calls · out 24,276 · in 48 · cache_read 625,143 · cache_create 215,311
- **claude-opus-5-5**: 3 agent · 13 calls · out 8,314 · in 26 · cache_read 242,965 · cache_create 86,144
- **claude-haiku-5-5**: 6 agent · 12 calls · out 11,284 · in 24 · cache_read 113,920 · cache_create 121,490

