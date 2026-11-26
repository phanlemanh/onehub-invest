### S4 round 1 — wf_7221c8a0-1a5 (20 agent, 94,195 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 33 | 31,406 | 66 | 1,815,180 | 3197 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 18 | 19,621 | 36 | 827,484 | 1618 |
| synthesize:report | claude-sonnet-5-5 | 2 | 7,326 | 4 | 50,399 | 38 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 6,749 | 6 | 89,548 | 266 |
| review:measurement | claude-opus-5-5 | 5 | 6,483 | 10 | 201,724 | 67 |
| review:bugs | claude-opus-5-5 | 5 | 4,867 | 10 | 234,067 | 58 |
| review:conventions | claude-opus-5-5 | 9 | 4,435 | 18 | 347,845 | 60 |
| triage | claude-sonnet-5-5 | 2 | 4,037 | 4 | 38,407 | 29 |
| machine:cd collector && rm -rf dist && npm run b | claude-haiku-5-5 | 2 | 1,827 | 4 | 37,060 | 13 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 906 | 4 | 37,072 | 8 |
| machine:bash _acceptance/s03-media-r2-allowlist/ | claude-haiku-5-5 | 2 | 823 | 4 | 37,064 | 12 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 818 | 4 | 37,074 | 6 |
| machine:node _acceptance/s03-media-r2-allowlist/ | claude-haiku-5-5 | 2 | 799 | 4 | 37,105 | 7 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 761 | 4 | 37,063 | 5 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 685 | 4 | 37,076 | 5 |
| machine:cd collector && rm -rf dist && npm test | claude-haiku-5-5 | 2 | 622 | 4 | 37,040 | 118 |
| machine:bash _acceptance/s03-media-r2-allowlist/ | claude-haiku-5-5 | 2 | 608 | 4 | 37,116 | 19 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 584 | 4 | 37,062 | 268 |
| machine:cd collector && npm run check | claude-haiku-5-5 | 2 | 506 | 4 | 37,026 | 7 |
| capture:provenance | claude-sonnet-5-5 | 2 | 332 | 4 | 32,418 | 4 |


wall: 5180s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 13 | 59,966 | 3,050,422 | 5108 | 03:15:25 | 04:40:34 |
| baseline | 1 | 6,749 | 89,548 | 266 | 03:15:25 | 03:19:52 |
| review | 3 | 15,785 | 783,636 | 76 | 03:15:25 | 03:16:42 |
| triage | 1 | 4,037 | 38,407 | 29 | 04:40:34 | 04:41:03 |
| capture | 1 | 332 | 32,418 | 4 | 04:41:03 | 04:41:07 |
| synthesize | 1 | 7,326 | 50,399 | 38 | 04:41:07 | 04:41:45 |

- **claude-haiku-5-5**: 13 agent · 73 calls · out 59,966 · in 146 · cache_read 3,050,422 · cache_create 506,934
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 18,444 · in 18 · cache_read 210,772 · cache_create 189,409
- **claude-opus-5-5**: 3 agent · 19 calls · out 15,785 · in 38 · cache_read 783,636 · cache_create 212,209

