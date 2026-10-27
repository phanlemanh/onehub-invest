### S4 round 1 — wf_84bec129-244 (19 agent, 68,127 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 11 | 11,613 | 22 | 493,877 | 125 |
| review:measurement | claude-opus-5-5 | 9 | 10,304 | 18 | 287,576 | 103 |
| synthesize:report | claude-sonnet-5-5 | 4 | 8,643 | 8 | 124,118 | 52 |
| review:conventions | claude-opus-5-5 | 10 | 6,643 | 20 | 460,686 | 77 |
| triage | claude-sonnet-5-5 | 2 | 5,241 | 4 | 23,684 | 36 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 5,199 | 4 | 22,907 | 27 |
| machine:bash _acceptance/test-nen-on22-on12/prob | claude-haiku-5-5 | 5 | 4,567 | 10 | 96,450 | 289 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,629 | 4 | 20,758 | 57 |
| machine:node _acceptance/test-nen-on22-on12/prob | claude-haiku-5-5 | 3 | 2,259 | 6 | 45,905 | 101 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,175 | 4 | 20,764 | 28 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,809 | 4 | 17,703 | 61 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,711 | 4 | 20,772 | 8 |
| machine:bash _acceptance/test-nen-on22-on12/prob | claude-haiku-5-5 | 2 | 1,209 | 4 | 20,795 | 7 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 988 | 4 | 20,783 | 17 |
| machine:node _acceptance/test-nen-on22-on12/prob | claude-haiku-5-5 | 2 | 833 | 4 | 20,794 | 23 |
| machine:bash _acceptance/test-nen-on22-on12/prob | claude-haiku-5-5 | 2 | 702 | 4 | 20,795 | 7 |
| machine:bash _acceptance/test-nen-on22-on12/prob | claude-haiku-5-5 | 2 | 665 | 4 | 20,795 | 11 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 506 | 4 | 20,841 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 431 | 4 | 16,501 | 5 |


wall: 384s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 5,199 | 22,907 | 27 | 04:30:34 | 04:31:01 |
| machine | 12 | 20,053 | 347,155 | 290 | 04:30:34 | 04:35:24 |
| review | 3 | 28,560 | 1,242,139 | 126 | 04:30:34 | 04:32:40 |
| triage | 1 | 5,241 | 23,684 | 36 | 04:35:24 | 04:36:00 |
| capture | 1 | 431 | 16,501 | 5 | 04:36:00 | 04:36:06 |
| synthesize | 1 | 8,643 | 124,118 | 52 | 04:36:06 | 04:36:58 |

- **claude-opus-5-5**: 3 agent · 30 calls · out 28,560 · in 60 · cache_read 1,242,139 · cache_create 190,163
- **claude-sonnet-5-5**: 4 agent · 10 calls · out 19,514 · in 20 · cache_read 187,210 · cache_create 125,757
- **claude-haiku-5-5**: 12 agent · 28 calls · out 20,053 · in 56 · cache_read 347,155 · cache_create 235,643

