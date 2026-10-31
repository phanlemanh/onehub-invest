### S4 round 1 — wf_b3386c72-41d (15 agent, 45,294 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 14 | 8,810 | 28 | 574,182 | 97 |
| review:bugs | claude-opus-5-5 | 11 | 6,508 | 24 | 435,046 | 70 |
| synthesize:report | claude-sonnet-5-5 | 2 | 5,788 | 4 | 31,513 | 32 |
| review:measurement | claude-opus-5-5 | 7 | 5,143 | 16 | 266,245 | 54 |
| triage | claude-sonnet-5-5 | 2 | 3,287 | 4 | 22,392 | 23 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,711 | 4 | 21,204 | 15 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,463 | 4 | 21,309 | 56 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,248 | 4 | 18,171 | 16 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,997 | 4 | 21,329 | 9 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,644 | 4 | 21,323 | 8 |
| machine:cd agent && node --import tsx --test tes | claude-haiku-5-5 | 2 | 1,564 | 4 | 21,337 | 9 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 1,018 | 4 | 21,315 | 60 |
| machine:cd agent && node --import tsx --test tes | claude-haiku-5-5 | 2 | 925 | 4 | 21,336 | 6 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 826 | 4 | 21,334 | 13 |
| capture:provenance | claude-sonnet-5-5 | 2 | 362 | 4 | 16,978 | 5 |


wall: 220s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,711 | 21,204 | 15 | 02:54:30 | 02:54:45 |
| machine | 8 | 12,685 | 167,454 | 161 | 02:54:30 | 02:57:11 |
| review | 3 | 20,461 | 1,275,473 | 97 | 02:54:30 | 02:56:07 |
| triage | 1 | 3,287 | 22,392 | 23 | 02:57:11 | 02:57:34 |
| capture | 1 | 362 | 16,978 | 5 | 02:57:34 | 02:57:39 |
| synthesize | 1 | 5,788 | 31,513 | 32 | 02:57:39 | 02:58:10 |

- **claude-opus-5-5**: 3 agent · 32 calls · out 20,461 · in 68 · cache_read 1,275,473 · cache_create 175,610
- **claude-sonnet-5-5**: 4 agent · 8 calls · out 12,148 · in 16 · cache_read 92,087 · cache_create 117,891
- **claude-haiku-5-5**: 8 agent · 16 calls · out 12,685 · in 32 · cache_read 167,454 · cache_create 159,226

### S4 round 2 — wf_52967e49-192 (15 agent, 37,819 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 13 | 7,774 | 28 | 634,879 | 82 |
| review:bugs | claude-opus-5-5 | 7 | 5,155 | 16 | 233,914 | 53 |
| synthesize:report | claude-sonnet-5-5 | 2 | 4,757 | 4 | 28,460 | 27 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,585 | 6 | 51,022 | 25 |
| review:conventions | claude-opus-5-5 | 10 | 3,365 | 20 | 301,725 | 42 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,365 | 4 | 21,558 | 66 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,342 | 4 | 21,564 | 104 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,108 | 4 | 21,578 | 9 |
| machine:cd agent && node --import tsx --test tes | claude-haiku-5-5 | 2 | 1,634 | 4 | 21,586 | 7 |
| machine:cd agent && node --import tsx --test tes | claude-haiku-5-5 | 2 | 1,032 | 4 | 21,585 | 6 |
| triage | claude-sonnet-5-5 | 2 | 1,009 | 4 | 19,933 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 994 | 4 | 21,583 | 22 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 711 | 4 | 18,420 | 12 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 620 | 4 | 21,572 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 368 | 4 | 17,227 | 5 |


wall: 257s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,585 | 51,022 | 25 | 06:26:46 | 06:27:12 |
| machine | 8 | 11,806 | 169,446 | 216 | 06:26:46 | 06:30:22 |
| review | 3 | 16,294 | 1,170,518 | 83 | 06:26:46 | 06:28:09 |
| triage | 1 | 1,009 | 19,933 | 9 | 06:30:22 | 06:30:31 |
| capture | 1 | 368 | 17,227 | 5 | 06:30:31 | 06:30:36 |
| synthesize | 1 | 4,757 | 28,460 | 27 | 06:30:36 | 06:31:03 |

- **claude-opus-5-5**: 3 agent · 30 calls · out 16,294 · in 64 · cache_read 1,170,518 · cache_create 153,946
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 9,719 · in 18 · cache_read 116,642 · cache_create 115,783
- **claude-haiku-5-5**: 8 agent · 16 calls · out 11,806 · in 32 · cache_read 169,446 · cache_create 161,515

