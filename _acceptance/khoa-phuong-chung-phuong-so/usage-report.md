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

