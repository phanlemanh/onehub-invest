### S4 round 1 — wf_397c311e-26e (21 agent, 45,206 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 2 | 6,084 | 4 | 30,479 | 35 |
| review:measurement | claude-opus-5-5 | 6 | 5,863 | 12 | 192,117 | 61 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 5,617 | 4 | 24,767 | 28 |
| review:bugs | claude-opus-5-5 | 10 | 3,580 | 20 | 360,961 | 38 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,511 | 4 | 22,134 | 58 |
| review:conventions | claude-opus-5-5 | 7 | 2,460 | 14 | 207,121 | 26 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,281 | 4 | 18,996 | 41 |
| machine:bash _acceptance/do-the-duyet-du-du-lieu | claude-haiku-5-5 | 3 | 1,897 | 8 | 45,221 | 24 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,870 | 4 | 22,154 | 8 |
| machine:bash _acceptance/do-the-duyet-du-du-lieu | claude-haiku-5-5 | 2 | 1,858 | 4 | 22,178 | 8 |
| triage | claude-sonnet-5-5 | 2 | 1,804 | 4 | 21,095 | 15 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,567 | 4 | 22,148 | 7 |
| refute:db.mjs | claude-sonnet-5-5 | 2 | 1,549 | 4 | 18,078 | 13 |
| machine:bash _acceptance/do-the-duyet-du-du-lieu | claude-haiku-5-5 | 2 | 1,015 | 4 | 22,178 | 7 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 935 | 4 | 22,159 | 15 |
| machine:node --test pipeline/do-the-duyet.test.m | claude-haiku-5-5 | 2 | 919 | 4 | 22,160 | 6 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 830 | 4 | 22,165 | 6 |
| machine:bash _acceptance/do-the-duyet-du-du-lieu | claude-haiku-5-5 | 2 | 829 | 4 | 22,174 | 6 |
| machine:bash _acceptance/do-the-duyet-du-du-lieu | claude-haiku-5-5 | 2 | 806 | 4 | 22,175 | 43 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 598 | 4 | 22,140 | 66 |
| capture:provenance | claude-sonnet-5-5 | 2 | 333 | 4 | 17,794 | 5 |


wall: 263s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 5,617 | 24,767 | 28 | 00:58:49 | 00:59:17 |
| machine | 13 | 17,916 | 307,982 | 195 | 00:58:49 | 01:02:04 |
| review | 3 | 11,903 | 760,199 | 62 | 00:58:49 | 00:59:50 |
| triage | 1 | 1,804 | 21,095 | 15 | 01:02:04 | 01:02:19 |
| refute | 1 | 1,549 | 18,078 | 13 | 01:02:19 | 01:02:32 |
| capture | 1 | 333 | 17,794 | 5 | 01:02:32 | 01:02:37 |
| synthesize | 1 | 6,084 | 30,479 | 35 | 01:02:37 | 01:03:11 |

- **claude-sonnet-5-5**: 5 agent · 10 calls · out 15,387 · in 20 · cache_read 112,213 · cache_create 149,394
- **claude-opus-5-5**: 3 agent · 23 calls · out 11,903 · in 46 · cache_read 760,199 · cache_create 165,869
- **claude-haiku-5-5**: 13 agent · 27 calls · out 17,916 · in 56 · cache_read 307,982 · cache_create 264,554

### S4 round 2 — wf_1414b410-24e (14 agent, 26,704 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 6 | 5,113 | 12 | 195,346 | 38 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 3 | 2,807 | 8 | 45,665 | 11 |
| review:conventions | claude-opus-5-5 | 5 | 2,511 | 10 | 94,817 | 28 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,435 | 4 | 22,187 | 56 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,314 | 4 | 22,189 | 28 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,160 | 4 | 21,535 | 13 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,821 | 4 | 22,207 | 8 |
| triage | claude-sonnet-5-5 | 3 | 1,475 | 6 | 46,935 | 13 |
| review:bugs | claude-opus-5-5 | 5 | 1,403 | 12 | 128,105 | 17 |
| machine:bash _acceptance/do-the-duyet-du-du-lieu | claude-haiku-5-5 | 2 | 1,374 | 4 | 22,227 | 22 |
| review:measurement | claude-opus-5-5 | 3 | 1,346 | 6 | 46,058 | 14 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 842 | 4 | 22,212 | 15 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 777 | 4 | 22,193 | 60 |
| capture:provenance | claude-sonnet-5-5 | 2 | 326 | 4 | 17,847 | 5 |


wall: 234s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,160 | 21,535 | 13 | 01:05:44 | 01:05:57 |
| machine | 7 | 12,370 | 178,880 | 178 | 01:05:44 | 01:08:41 |
| review | 3 | 5,260 | 268,980 | 28 | 01:05:44 | 01:06:12 |
| triage | 1 | 1,475 | 46,935 | 13 | 01:08:41 | 01:08:55 |
| capture | 1 | 326 | 17,847 | 5 | 01:08:55 | 01:08:59 |
| synthesize | 1 | 5,113 | 195,346 | 38 | 01:08:59 | 01:09:38 |

- **claude-sonnet-5-5**: 4 agent · 13 calls · out 9,074 · in 26 · cache_read 281,663 · cache_create 119,118
- **claude-haiku-5-5**: 7 agent · 15 calls · out 12,370 · in 32 · cache_read 178,880 · cache_create 144,366
- **claude-opus-5-5**: 3 agent · 13 calls · out 5,260 · in 28 · cache_read 268,980 · cache_create 91,493

