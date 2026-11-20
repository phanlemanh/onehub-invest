### S4 round 1 — wf_417cf08a-f8d (17 agent, 51,466 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 9 | 7,682 | 18 | 405,450 | 78 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 17 | 7,094 | 34 | 575,514 | 1844 |
| synthesize:report | claude-sonnet-5-5 | 2 | 4,609 | 4 | 41,242 | 27 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 7 | 4,349 | 14 | 180,142 | 1018 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,270 | 6 | 77,573 | 25 |
| review:measurement | claude-opus-5-5 | 3 | 3,794 | 6 | 81,758 | 40 |
| machine:bash _acceptance/ca-doi-chieu-tin-rao-na | claude-haiku-5-5 | 4 | 3,063 | 8 | 110,474 | 120 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,731 | 4 | 30,993 | 84 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,290 | 4 | 3,300 | 490 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,099 | 4 | 34,303 | 9 |
| review:conventions | claude-opus-5-5 | 6 | 2,087 | 12 | 221,968 | 24 |
| machine:bash _acceptance/ca-doi-chieu-tin-rao-na | claude-haiku-5-5 | 3 | 2,071 | 6 | 72,813 | 19 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,661 | 4 | 34,307 | 7 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,246 | 4 | 34,305 | 17 |
| triage | claude-sonnet-5-5 | 2 | 1,071 | 4 | 32,201 | 9 |
| machine:bash _acceptance/ca-doi-chieu-tin-rao-na | claude-haiku-5-5 | 2 | 1,036 | 4 | 34,310 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 313 | 4 | 29,745 | 3 |


wall: 3509s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,270 | 77,573 | 25 | 07:05:10 | 07:05:35 |
| review | 3 | 13,563 | 709,176 | 79 | 07:05:10 | 07:06:29 |
| machine | 10 | 27,640 | 1,110,461 | 3470 | 07:05:10 | 08:03:00 |
| triage | 1 | 1,071 | 32,201 | 9 | 08:03:00 | 08:03:09 |
| capture | 1 | 313 | 29,745 | 3 | 08:03:09 | 08:03:12 |
| synthesize | 1 | 4,609 | 41,242 | 27 | 08:03:12 | 08:03:39 |

- **claude-opus-5-5**: 3 agent · 18 calls · out 13,563 · in 36 · cache_read 709,176 · cache_create 169,001
- **claude-haiku-5-5**: 10 agent · 43 calls · out 27,640 · in 86 · cache_read 1,110,461 · cache_create 432,954
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 10,263 · in 18 · cache_read 180,761 · cache_create 164,464

