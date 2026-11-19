### S4 round 1 — wf_60ef7a41-880 (16 agent, 42,749 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 16 | 7,083 | 32 | 599,757 | 1248 |
| synthesize:report | claude-sonnet-5-5 | 2 | 4,632 | 4 | 40,169 | 27 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,660 | 6 | 75,121 | 22 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 7 | 3,268 | 14 | 178,747 | 977 |
| review:bugs | claude-opus-5-5 | 5 | 2,997 | 10 | 155,783 | 31 |
| review:measurement | claude-opus-5-5 | 4 | 2,946 | 8 | 117,006 | 31 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,758 | 4 | 30,618 | 74 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,520 | 4 | 3,300 | 486 |
| review:conventions | claude-opus-5-5 | 4 | 2,380 | 8 | 107,864 | 25 |
| machine:bash _acceptance/on12-ac5-bo-dong-s03-mo | claude-haiku-5-5 | 3 | 2,358 | 6 | 72,092 | 50 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,094 | 4 | 33,928 | 9 |
| triage | claude-sonnet-5-5 | 2 | 1,834 | 4 | 32,889 | 14 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,691 | 4 | 33,932 | 9 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,226 | 4 | 33,930 | 16 |
| machine:bash _acceptance/on12-ac5-bo-dong-s03-mo | claude-haiku-5-5 | 2 | 896 | 4 | 33,932 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 406 | 4 | 29,375 | 4 |


wall: 2865s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,660 | 75,121 | 22 | 17:24:59 | 17:25:21 |
| machine | 9 | 23,894 | 1,020,236 | 2820 | 17:24:59 | 18:11:59 |
| review | 3 | 8,323 | 380,653 | 32 | 17:24:59 | 17:25:31 |
| triage | 1 | 1,834 | 32,889 | 14 | 18:11:59 | 18:12:13 |
| capture | 1 | 406 | 29,375 | 4 | 18:12:13 | 18:12:17 |
| synthesize | 1 | 4,632 | 40,169 | 27 | 18:12:17 | 18:12:44 |

- **claude-haiku-5-5**: 9 agent · 38 calls · out 23,894 · in 76 · cache_read 1,020,236 · cache_create 408,471
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 10,532 · in 18 · cache_read 177,554 · cache_create 161,659
- **claude-opus-5-5**: 3 agent · 13 calls · out 8,323 · in 26 · cache_read 380,653 · cache_create 134,282

### S4 round 2 — wf_960f3284-3d4 (13 agent, 31,416 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 9 | 5,457 | 18 | 250,521 | 1162 |
| review:measurement | claude-opus-5-5 | 4 | 4,265 | 8 | 108,541 | 41 |
| synthesize:report | claude-sonnet-5-5 | 2 | 4,096 | 4 | 40,349 | 23 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 8 | 3,336 | 16 | 215,856 | 1159 |
| review:bugs | claude-opus-5-5 | 4 | 2,876 | 8 | 116,116 | 31 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,114 | 4 | 33,932 | 8 |
| triage | claude-sonnet-5-5 | 2 | 1,939 | 4 | 32,884 | 15 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,864 | 4 | 33,936 | 8 |
| review:conventions | claude-opus-5-5 | 3 | 1,558 | 6 | 69,141 | 16 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 3 | 1,497 | 6 | 37,415 | 699 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,203 | 4 | 33,934 | 20 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 802 | 4 | 30,622 | 82 |
| capture:provenance | claude-sonnet-5-5 | 2 | 409 | 4 | 29,379 | 3 |


wall: 3178s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 7 | 16,273 | 636,216 | 3137 | 18:41:45 | 19:34:02 |
| review | 3 | 8,699 | 293,798 | 42 | 18:41:45 | 18:42:27 |
| triage | 1 | 1,939 | 32,884 | 15 | 19:34:02 | 19:34:17 |
| capture | 1 | 409 | 29,379 | 3 | 19:34:17 | 19:34:21 |
| synthesize | 1 | 4,096 | 40,349 | 23 | 19:34:21 | 19:34:44 |

- **claude-haiku-5-5**: 7 agent · 28 calls · out 16,273 · in 56 · cache_read 636,216 · cache_create 324,657
- **claude-opus-5-5**: 3 agent · 11 calls · out 8,699 · in 22 · cache_read 293,798 · cache_create 129,004
- **claude-sonnet-5-5**: 3 agent · 6 calls · out 6,444 · in 12 · cache_read 102,612 · cache_create 120,951

