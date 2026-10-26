### S4 round 1 — wf_e107a8ce-43a (21 agent, 67,524 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 18 | 10,853 | 36 | 1,101,087 | 117 |
| review:measurement | claude-opus-5-5 | 8 | 9,480 | 16 | 313,196 | 95 |
| review:bugs | claude-opus-5-5 | 19 | 9,107 | 38 | 1,176,969 | 110 |
| synthesize:report | claude-sonnet-5-5 | 3 | 8,913 | 6 | 79,475 | 49 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 6,344 | 4 | 23,524 | 80 |
| triage | claude-sonnet-5-5 | 2 | 4,403 | 4 | 22,013 | 34 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,233 | 4 | 20,492 | 20 |
| machine:cd pipeline && node --test scripts/vocab | claude-haiku-5-5 | 2 | 2,218 | 4 | 20,535 | 12 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,060 | 4 | 20,488 | 12 |
| refute:vocab-db.itest.mjs | claude-sonnet-5-5 | 6 | 1,761 | 12 | 127,194 | 17 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,573 | 4 | 20,506 | 7 |
| machine:node pipeline/vocab.mjs --lint | claude-haiku-5-5 | 2 | 1,345 | 4 | 20,511 | 8 |
| refute:vocab-lint.test.mjs | claude-sonnet-5-5 | 3 | 1,221 | 6 | 37,158 | 11 |
| refute:vocab-lint.test.mjs | claude-sonnet-5-5 | 3 | 1,111 | 6 | 39,668 | 13 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,089 | 4 | 20,511 | 13 |
| machine:cd pipeline && node --test scripts/vocab | claude-haiku-5-5 | 2 | 829 | 4 | 20,522 | 8 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 760 | 4 | 17,436 | 43 |
| machine:node pipeline/vocab.mjs --check-db | claude-haiku-5-5 | 2 | 723 | 4 | 20,513 | 6 |
| machine:node pipeline/vocab.mjs --check | claude-haiku-5-5 | 2 | 598 | 4 | 20,509 | 6 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 546 | 4 | 20,500 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 357 | 4 | 16,238 | 5 |


wall: 224s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 6,344 | 23,524 | 80 | 02:22:48 | 02:24:08 |
| machine | 11 | 13,974 | 222,523 | 99 | 02:22:48 | 02:24:27 |
| review | 3 | 29,440 | 2,591,252 | 117 | 02:22:48 | 02:24:45 |
| triage | 1 | 4,403 | 22,013 | 34 | 02:24:45 | 02:25:19 |
| refute | 3 | 4,093 | 204,020 | 19 | 02:25:19 | 02:25:38 |
| capture | 1 | 357 | 16,238 | 5 | 02:25:38 | 02:25:42 |
| synthesize | 1 | 8,913 | 79,475 | 49 | 02:25:42 | 02:26:32 |

- **claude-opus-5-5**: 3 agent · 45 calls · out 29,440 · in 90 · cache_read 2,591,252 · cache_create 233,921
- **claude-sonnet-5-5**: 7 agent · 21 calls · out 24,110 · in 42 · cache_read 345,270 · cache_create 196,892
- **claude-haiku-5-5**: 11 agent · 22 calls · out 13,974 · in 44 · cache_read 222,523 · cache_create 206,045

