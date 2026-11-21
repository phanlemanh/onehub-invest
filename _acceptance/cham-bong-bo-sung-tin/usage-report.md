### S4 round 1 — wf_605e54d0-5da (24 agent, 103,032 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 22 | 20,116 | 44 | 1,728,488 | 244 |
| review:measurement | claude-opus-5-5 | 9 | 15,983 | 18 | 564,995 | 168 |
| synthesize:report | claude-sonnet-5-5 | 2 | 9,760 | 4 | 61,806 | 54 |
| review:conventions | claude-opus-5-5 | 13 | 8,759 | 26 | 746,957 | 109 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 8,331 | 6 | 90,599 | 46 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 11 | 5,230 | 22 | 339,884 | 1226 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 16 | 4,958 | 32 | 539,956 | 1594 |
| triage | claude-sonnet-5-5 | 2 | 3,973 | 4 | 37,819 | 27 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 5 | 3,662 | 10 | 112,617 | 753 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,963 | 4 | 31,790 | 230 |
| machine:bash _acceptance/cham-bong-bo-sung-tin/p | claude-haiku-5-5 | 2 | 2,059 | 4 | 35,095 | 85 |
| machine:bash _acceptance/cham-bong-bo-sung-tin/p | claude-haiku-5-5 | 2 | 2,033 | 4 | 35,095 | 85 |
| machine:bash _acceptance/cham-bong-bo-sung-tin/p | claude-haiku-5-5 | 2 | 1,939 | 4 | 35,095 | 85 |
| machine:bash _acceptance/cham-bong-bo-sung-tin/p | claude-haiku-5-5 | 3 | 1,920 | 6 | 70,583 | 86 |
| machine:bash _acceptance/cham-bong-bo-sung-tin/p | claude-haiku-5-5 | 2 | 1,790 | 4 | 35,095 | 85 |
| machine:bash _acceptance/cham-bong-bo-sung-tin/p | claude-haiku-5-5 | 2 | 1,733 | 4 | 35,095 | 84 |
| machine:bash _acceptance/cham-bong-bo-sung-tin/p | claude-haiku-5-5 | 2 | 1,485 | 4 | 35,095 | 84 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,234 | 4 | 35,102 | 18 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 975 | 4 | 35,104 | 6 |
| machine:bash _acceptance/cham-bong-bo-sung-tin/p | claude-haiku-5-5 | 2 | 975 | 4 | 35,095 | 82 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 958 | 4 | 35,100 | 5 |
| machine:bash _acceptance/cham-bong-bo-sung-tin/p | claude-haiku-5-5 | 2 | 951 | 4 | 35,095 | 82 |
| machine:bash _acceptance/cham-bong-bo-sung-tin/p | claude-haiku-5-5 | 2 | 829 | 4 | 35,095 | 189 |
| capture:provenance | claude-sonnet-5-5 | 2 | 416 | 4 | 30,552 | 4 |


wall: 3917s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 8,331 | 90,599 | 46 | 09:24:18 | 09:25:04 |
| review | 3 | 44,858 | 3,040,440 | 246 | 09:24:18 | 09:28:24 |
| machine | 17 | 35,694 | 1,515,991 | 3833 | 09:24:18 | 10:28:11 |
| triage | 1 | 3,973 | 37,819 | 27 | 10:28:11 | 10:28:38 |
| capture | 1 | 416 | 30,552 | 4 | 10:28:38 | 10:28:41 |
| synthesize | 1 | 9,760 | 61,806 | 54 | 10:28:41 | 10:29:35 |

- **claude-opus-5-5**: 3 agent · 44 calls · out 44,858 · in 88 · cache_read 3,040,440 · cache_create 316,689
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 22,480 · in 18 · cache_read 220,776 · cache_create 202,716
- **claude-haiku-5-5**: 17 agent · 61 calls · out 35,694 · in 122 · cache_read 1,515,991 · cache_create 668,090

