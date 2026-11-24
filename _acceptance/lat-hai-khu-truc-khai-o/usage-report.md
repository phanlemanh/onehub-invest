### S4 round 1 — wf_e1e749e3-7d9 (16 agent, 59,189 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 9 | 9,807 | 18 | 412,895 | 98 |
| review:conventions | claude-opus-5-5 | 11 | 7,550 | 22 | 524,699 | 77 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 17 | 7,116 | 34 | 598,901 | 1859 |
| review:bugs | claude-opus-5-5 | 13 | 6,470 | 26 | 672,603 | 68 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,066 | 4 | 46,034 | 33 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 10 | 5,790 | 20 | 230,574 | 1683 |
| triage | claude-sonnet-5-5 | 2 | 3,636 | 4 | 37,822 | 25 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,630 | 6 | 79,973 | 24 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,888 | 4 | 36,780 | 9 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,823 | 4 | 36,784 | 19 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 5 | 1,696 | 10 | 114,233 | 705 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,113 | 4 | 36,782 | 24 |
| machine:bash _acceptance/lat-hai-khu-truc-khai-o | claude-haiku-5-5 | 2 | 915 | 4 | 36,772 | 7 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 695 | 4 | 36,770 | 6 |
| machine:bash _acceptance/lat-hai-khu-truc-khai-o | claude-haiku-5-5 | 2 | 561 | 4 | 36,781 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 433 | 4 | 32,130 | 5 |


wall: 4369s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,630 | 79,973 | 24 | 17:30:03 | 17:30:28 |
| review | 3 | 23,827 | 1,610,197 | 99 | 17:30:03 | 17:31:42 |
| machine | 9 | 21,597 | 1,164,377 | 4306 | 17:30:03 | 18:41:49 |
| triage | 1 | 3,636 | 37,822 | 25 | 18:41:49 | 18:42:14 |
| capture | 1 | 433 | 32,130 | 5 | 18:42:14 | 18:42:19 |
| synthesize | 1 | 6,066 | 46,034 | 33 | 18:42:19 | 18:42:52 |

- **claude-opus-5-5**: 3 agent · 33 calls · out 23,827 · in 66 · cache_read 1,610,197 · cache_create 198,899
- **claude-haiku-5-5**: 9 agent · 44 calls · out 21,597 · in 88 · cache_read 1,164,377 · cache_create 496,283
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 13,765 · in 18 · cache_read 195,959 · cache_create 175,741

