### S4 round 3 — wf_750e86fb-a09 (22 agent, 181,234 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 32 | 27,192 | 66 | 3,868,392 | 295 |
| machine:bash _acceptance/phuong-tu-du-an-chay-th | claude-haiku-5-5 | 38 | 25,717 | 76 | 1,862,729 | 3666 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 17 | 19,024 | 34 | 728,003 | 1529 |
| machine:node --test scripts/*.test.mjs | claude-haiku-5-5 | 14 | 15,907 | 28 | 567,236 | 1102 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 12 | 13,736 | 24 | 464,727 | 953 |
| review:measurement | claude-opus-5-5 | 10 | 12,025 | 20 | 529,642 | 124 |
| review:conventions | claude-opus-5-5 | 11 | 9,933 | 24 | 726,580 | 104 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 8,757 | 6 | 90,523 | 298 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 7 | 8,363 | 14 | 233,786 | 505 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,923 | 4 | 45,461 | 37 |
| machine:bash _acceptance/phuong-tu-du-an-chay-th | claude-haiku-5-5 | 5 | 4,739 | 10 | 150,243 | 317 |
| machine:bash _acceptance/phuong-tu-du-an-chay-th | claude-haiku-5-5 | 5 | 4,681 | 10 | 150,048 | 317 |
| machine:bash _acceptance/phuong-tu-du-an-chay-th | claude-haiku-5-5 | 4 | 4,661 | 8 | 111,024 | 196 |
| machine:bash _acceptance/phuong-tu-du-an-chay-th | claude-haiku-5-5 | 5 | 4,358 | 10 | 149,686 | 314 |
| machine:bash _acceptance/phuong-tu-du-an-chay-th | claude-haiku-5-5 | 4 | 3,403 | 8 | 110,804 | 193 |
| triage | claude-sonnet-5-5 | 2 | 3,390 | 4 | 35,228 | 25 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,732 | 4 | 34,388 | 75 |
| machine:node --test scripts/phuong-tu-du-an-chuo | claude-haiku-5-5 | 3 | 2,282 | 6 | 73,022 | 21 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,221 | 4 | 34,400 | 18 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 918 | 4 | 34,398 | 5 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 850 | 4 | 34,402 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 422 | 4 | 29,851 | 4 |


wall: 3732s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 49,150 | 5,124,614 | 296 | 19:08:42 | 19:13:39 |
| machine | 15 | 112,592 | 4,738,896 | 3667 | 19:08:42 | 20:09:49 |
| baseline | 1 | 8,757 | 90,523 | 298 | 19:08:42 | 19:13:41 |
| triage | 1 | 3,390 | 35,228 | 25 | 20:09:49 | 20:10:14 |
| capture | 1 | 422 | 29,851 | 4 | 20:10:14 | 20:10:18 |
| synthesize | 1 | 6,923 | 45,461 | 37 | 20:10:18 | 20:10:55 |

- **claude-opus-5-5**: 3 agent · 53 calls · out 49,150 · in 110 · cache_read 5,124,614 · cache_create 348,879
- **claude-haiku-5-5**: 15 agent · 122 calls · out 112,592 · in 244 · cache_read 4,738,896 · cache_create 619,486
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 19,492 · in 18 · cache_read 201,063 · cache_create 182,268

