### S4 round 1 — wf_1cebafbe-85f (17 agent, 50,225 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 11 | 10,471 | 22 | 413,987 | 115 |
| review:conventions | claude-opus-5-5 | 20 | 10,434 | 40 | 857,946 | 118 |
| review:bugs | claude-opus-5-5 | 9 | 5,853 | 18 | 303,508 | 119 |
| synthesize:report | claude-sonnet-5-5 | 3 | 5,750 | 6 | 64,531 | 36 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 4,124 | 4 | 21,925 | 22 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,147 | 4 | 20,785 | 27 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,846 | 4 | 17,724 | 11 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,731 | 4 | 20,793 | 9 |
| triage | claude-sonnet-5-5 | 2 | 1,632 | 4 | 19,691 | 16 |
| machine:bash _acceptance/ui-standards-reui-thuoc | claude-haiku-5-5 | 2 | 1,167 | 4 | 20,826 | 7 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,078 | 4 | 20,804 | 15 |
| machine:bash _acceptance/ui-standards-reui-thuoc | claude-haiku-5-5 | 2 | 799 | 4 | 20,823 | 13 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 783 | 4 | 20,779 | 40 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 696 | 4 | 20,799 | 6 |
| machine:node _acceptance/ui-standards-reui-thuoc | claude-haiku-5-5 | 2 | 692 | 4 | 20,825 | 6 |
| machine:bash _acceptance/ui-standards-reui-thuoc | claude-haiku-5-5 | 2 | 683 | 4 | 20,823 | 39 |
| capture:provenance | claude-sonnet-5-5 | 2 | 339 | 4 | 16,522 | 4 |


wall: 178s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,124 | 21,925 | 22 | 05:59:24 | 05:59:46 |
| machine | 10 | 11,622 | 204,981 | 108 | 05:59:24 | 06:01:13 |
| review | 3 | 26,758 | 1,575,441 | 121 | 05:59:24 | 06:01:25 |
| triage | 1 | 1,632 | 19,691 | 16 | 06:01:25 | 06:01:41 |
| capture | 1 | 339 | 16,522 | 4 | 06:01:41 | 06:01:45 |
| synthesize | 1 | 5,750 | 64,531 | 36 | 06:01:45 | 06:02:22 |

- **claude-opus-5-5**: 3 agent · 40 calls · out 26,758 · in 80 · cache_read 1,575,441 · cache_create 165,094
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 11,845 · in 18 · cache_read 122,669 · cache_create 111,421
- **claude-haiku-5-5**: 10 agent · 20 calls · out 11,622 · in 40 · cache_read 204,981 · cache_create 189,881

