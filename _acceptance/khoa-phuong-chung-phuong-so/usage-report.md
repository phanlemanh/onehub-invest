### S4 round 1 — wf_7efbd82a-764 (14 agent, 25,005 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 2 | 4,382 | 4 | 28,329 | 26 |
| review:bugs | claude-opus-5-5 | 5 | 2,973 | 10 | 117,806 | 30 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,537 | 4 | 21,242 | 14 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,196 | 4 | 18,376 | 23 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,131 | 4 | 21,520 | 53 |
| review:conventions | claude-opus-5-5 | 4 | 1,942 | 8 | 81,303 | 20 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 1,603 | 4 | 21,514 | 52 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,509 | 4 | 21,528 | 6 |
| review:measurement | claude-opus-5-5 | 3 | 1,496 | 6 | 54,621 | 16 |
| triage | claude-sonnet-5-5 | 2 | 1,459 | 4 | 20,142 | 11 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 990 | 4 | 18,410 | 10 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 891 | 4 | 21,539 | 15 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 566 | 4 | 21,534 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 330 | 4 | 17,172 | 4 |


wall: 193s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,537 | 21,242 | 14 | 16:01:57 | 16:02:11 |
| machine | 7 | 9,886 | 144,421 | 152 | 16:01:57 | 16:04:29 |
| review | 3 | 6,411 | 253,730 | 31 | 16:01:57 | 16:02:28 |
| triage | 1 | 1,459 | 20,142 | 11 | 16:04:29 | 16:04:40 |
| capture | 1 | 330 | 17,172 | 4 | 16:04:40 | 16:04:45 |
| synthesize | 1 | 4,382 | 28,329 | 26 | 16:04:45 | 16:05:10 |

- **claude-sonnet-5-5**: 4 agent · 8 calls · out 8,708 · in 16 · cache_read 86,885 · cache_create 111,635
- **claude-opus-5-5**: 3 agent · 12 calls · out 6,411 · in 24 · cache_read 253,730 · cache_create 113,206
- **claude-haiku-5-5**: 7 agent · 14 calls · out 9,886 · in 28 · cache_read 144,421 · cache_create 143,556

### S4 round 2 — wf_a02a27b5-46e (12 agent, 21,578 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 2 | 3,700 | 4 | 29,296 | 24 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,625 | 4 | 21,329 | 55 |
| review:conventions | claude-opus-5-5 | 5 | 2,450 | 10 | 117,397 | 26 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,367 | 4 | 18,191 | 20 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,168 | 4 | 21,335 | 58 |
| review:bugs | claude-opus-5-5 | 8 | 2,161 | 16 | 218,724 | 27 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,624 | 4 | 21,343 | 7 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,119 | 4 | 21,349 | 5 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,118 | 4 | 21,354 | 13 |
| review:measurement | claude-opus-5-5 | 3 | 1,067 | 6 | 52,549 | 13 |
| triage | claude-sonnet-5-5 | 2 | 855 | 4 | 19,446 | 12 |
| capture:provenance | claude-sonnet-5-5 | 2 | 324 | 4 | 16,987 | 5 |


wall: 199s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 6 | 11,021 | 124,901 | 158 | 16:14:41 | 16:17:18 |
| review | 3 | 5,678 | 388,670 | 28 | 16:14:41 | 16:15:09 |
| triage | 1 | 855 | 19,446 | 12 | 16:17:18 | 16:17:31 |
| capture | 1 | 324 | 16,987 | 5 | 16:17:31 | 16:17:35 |
| synthesize | 1 | 3,700 | 29,296 | 24 | 16:17:35 | 16:17:59 |

- **claude-sonnet-5-5**: 3 agent · 6 calls · out 4,879 · in 12 · cache_read 65,729 · cache_create 85,058
- **claude-haiku-5-5**: 6 agent · 12 calls · out 11,021 · in 24 · cache_read 124,901 · cache_create 121,472
- **claude-opus-5-5**: 3 agent · 16 calls · out 5,678 · in 32 · cache_read 388,670 · cache_create 111,257

### S4 round 3 — wf_8e1c92b8-8e9 (11 agent, 15,578 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 2 | 2,866 | 4 | 28,139 | 19 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,568 | 4 | 21,343 | 57 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,207 | 4 | 21,345 | 18 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,029 | 4 | 21,349 | 62 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,833 | 4 | 21,363 | 7 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,623 | 4 | 21,357 | 7 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,053 | 4 | 21,368 | 23 |
| review:bugs | claude-opus-5-5 | 3 | 455 | 8 | 40,869 | 7 |
| review:measurement | claude-opus-5-5 | 2 | 377 | 4 | 20,536 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 335 | 4 | 17,001 | 4 |
| review:conventions | claude-opus-5-5 | 2 | 232 | 4 | 17,118 | 4 |


wall: 197s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 6 | 11,313 | 128,125 | 174 | 16:22:19 | 16:25:13 |
| review | 3 | 1,064 | 78,523 | 8 | 16:22:19 | 16:22:27 |
| capture | 1 | 335 | 17,001 | 4 | 16:25:13 | 16:25:17 |
| synthesize | 1 | 2,866 | 28,139 | 19 | 16:25:17 | 16:25:36 |

- **claude-sonnet-5-5**: 2 agent · 4 calls · out 3,201 · in 8 · cache_read 45,140 · cache_create 59,491
- **claude-haiku-5-5**: 6 agent · 12 calls · out 11,313 · in 24 · cache_read 128,125 · cache_create 118,270
- **claude-opus-5-5**: 3 agent · 7 calls · out 1,064 · in 16 · cache_read 78,523 · cache_create 61,423

