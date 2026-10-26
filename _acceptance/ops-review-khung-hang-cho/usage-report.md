### S4 round 1 — wf_1b2d7b83-71e (24 agent, 90,483 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 4 | 16,072 | 8 | 141,241 | 96 |
| ui:E13 | claude-sonnet-5-5 | 26 | 15,475 | 52 | 2,500,308 | 186 |
| review:measurement | claude-opus-5-5 | 8 | 8,839 | 16 | 360,552 | 98 |
| review:bugs | claude-opus-5-5 | 20 | 8,079 | 40 | 1,024,962 | 106 |
| review:conventions | claude-opus-5-5 | 17 | 7,046 | 34 | 844,062 | 90 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 4,595 | 4 | 25,022 | 57 |
| judge:E18:domain-correctness | claude-sonnet-5-5 | 4 | 3,009 | 8 | 71,564 | 23 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,594 | 4 | 20,397 | 39 |
| machine:cd app && BASE_URL=${BASE_URL:-http://ui | claude-haiku-5-5 | 2 | 2,535 | 4 | 20,464 | 27 |
| triage | claude-sonnet-5-5 | 2 | 2,525 | 4 | 21,928 | 18 |
| refute:smoke-review-queue.mjs | claude-sonnet-5-5 | 4 | 2,365 | 8 | 72,908 | 18 |
| judge:E18:operational-feasibility | claude-sonnet-5-5 | 4 | 2,359 | 8 | 76,704 | 20 |
| judge:E18:spec-alignment | claude-sonnet-5-5 | 3 | 2,260 | 6 | 43,938 | 18 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,191 | 4 | 20,471 | 18 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,886 | 4 | 20,433 | 9 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,624 | 4 | 20,519 | 8 |
| refute:review-content.tsx | claude-sonnet-5-5 | 5 | 1,396 | 10 | 95,629 | 13 |
| refute:review-content.tsx | claude-sonnet-5-5 | 3 | 1,252 | 6 | 46,272 | 11 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,152 | 4 | 20,422 | 16 |
| machine:node /Users/manhphan/.claude/plugins/cac | claude-haiku-5-5 | 2 | 877 | 4 | 20,486 | 6 |
| machine:node scripts/check-review-media-local-on | claude-haiku-5-5 | 2 | 789 | 4 | 20,415 | 5 |
| machine:cd app && node --test eslint-plugin-oneh | claude-haiku-5-5 | 2 | 728 | 4 | 20,436 | 6 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 506 | 4 | 20,513 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 329 | 4 | 16,413 | 4 |


wall: 323s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,595 | 25,022 | 57 | 05:39:40 | 05:40:37 |
| machine | 10 | 14,882 | 204,556 | 96 | 05:39:40 | 05:41:16 |
| ui | 1 | 15,475 | 2,500,308 | 186 | 05:39:40 | 05:42:46 |
| judge | 3 | 7,628 | 192,206 | 23 | 05:39:40 | 05:40:03 |
| review | 3 | 23,964 | 2,229,576 | 108 | 05:39:40 | 05:41:28 |
| triage | 1 | 2,525 | 21,928 | 18 | 05:42:46 | 05:43:04 |
| refute | 3 | 5,013 | 214,809 | 20 | 05:43:04 | 05:43:23 |
| capture | 1 | 329 | 16,413 | 4 | 05:43:23 | 05:43:28 |
| synthesize | 1 | 16,072 | 141,241 | 96 | 05:43:28 | 05:45:04 |

- **claude-sonnet-5-5**: 11 agent · 59 calls · out 51,637 · in 118 · cache_read 3,111,927 · cache_create 418,553
- **claude-opus-5-5**: 3 agent · 45 calls · out 23,964 · in 90 · cache_read 2,229,576 · cache_create 210,073
- **claude-haiku-5-5**: 10 agent · 20 calls · out 14,882 · in 40 · cache_read 204,556 · cache_create 184,193

### S4 round 2 — wf_02b05940-c0d (21 agent, 67,657 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 4 | 14,206 | 8 | 143,372 | 95 |
| ui:E13 | claude-sonnet-5-5 | 18 | 8,093 | 36 | 1,596,068 | 372 |
| review:bugs | claude-opus-5-5 | 9 | 5,390 | 18 | 292,587 | 73 |
| review:measurement | claude-opus-5-5 | 6 | 4,979 | 12 | 190,371 | 67 |
| review:conventions | claude-opus-5-5 | 11 | 3,870 | 22 | 334,363 | 68 |
| judge:E18:domain-correctness | claude-sonnet-5-5 | 5 | 3,002 | 10 | 103,313 | 21 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,879 | 4 | 20,206 | 34 |
| judge:E18:spec-alignment | claude-sonnet-5-5 | 4 | 2,701 | 8 | 77,270 | 20 |
| refute:smoke-review-queue.mjs | claude-sonnet-5-5 | 8 | 2,571 | 16 | 174,297 | 34 |
| judge:E18:operational-feasibility | claude-sonnet-5-5 | 3 | 2,347 | 6 | 48,404 | 18 |
| refute:review-queue.test.tsx | claude-sonnet-5-5 | 4 | 2,141 | 8 | 70,434 | 21 |
| triage | claude-sonnet-5-5 | 2 | 2,123 | 4 | 20,389 | 17 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,051 | 4 | 20,449 | 13 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,906 | 4 | 20,463 | 9 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,799 | 4 | 20,445 | 10 |
| machine:cd app && BASE_URL=${BASE_URL:-http://ui | claude-haiku-5-5 | 2 | 1,794 | 4 | 20,510 | 11 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 1,723 | 4 | 17,386 | 20 |
| refute:review-queue.ts | claude-sonnet-5-5 | 5 | 1,455 | 10 | 88,552 | 15 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,382 | 4 | 20,457 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 910 | 4 | 20,468 | 14 |
| capture:provenance | claude-sonnet-5-5 | 2 | 335 | 4 | 16,182 | 5 |


wall: 524s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,879 | 20,206 | 34 | 06:00:14 | 06:00:48 |
| machine | 7 | 11,565 | 140,178 | 74 | 06:00:14 | 06:01:27 |
| ui | 1 | 8,093 | 1,596,068 | 372 | 06:00:14 | 06:06:26 |
| judge | 3 | 8,050 | 228,987 | 21 | 06:00:14 | 06:00:35 |
| review | 3 | 14,239 | 817,321 | 78 | 06:00:14 | 06:01:32 |
| triage | 1 | 2,123 | 20,389 | 17 | 06:06:26 | 06:06:43 |
| refute | 3 | 6,167 | 333,283 | 35 | 06:06:43 | 06:07:18 |
| capture | 1 | 335 | 16,182 | 5 | 06:07:18 | 06:07:22 |
| synthesize | 1 | 14,206 | 143,372 | 95 | 06:07:22 | 06:08:58 |

- **claude-sonnet-5-5**: 11 agent · 57 calls · out 41,853 · in 114 · cache_read 2,358,487 · cache_create 409,703
- **claude-opus-5-5**: 3 agent · 26 calls · out 14,239 · in 52 · cache_read 817,321 · cache_create 145,310
- **claude-haiku-5-5**: 7 agent · 14 calls · out 11,565 · in 28 · cache_read 140,178 · cache_create 130,753

