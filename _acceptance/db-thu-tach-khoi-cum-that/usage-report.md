### S4 round 1 — wf_6dff342e-490 (23 agent, 90,463 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 20 | 21,677 | 40 | 961,657 | 1870 |
| review:bugs | claude-opus-5-5 | 21 | 13,889 | 42 | 1,481,750 | 144 |
| synthesize:report | claude-sonnet-5-5 | 2 | 8,613 | 4 | 51,829 | 45 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 7,954 | 6 | 95,282 | 154 |
| review:conventions | claude-opus-5-5 | 15 | 7,100 | 30 | 934,154 | 74 |
| review:measurement | claude-opus-5-5 | 6 | 5,860 | 12 | 278,715 | 59 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 5 | 5,330 | 10 | 159,946 | 222 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 4 | 3,869 | 8 | 120,579 | 120 |
| triage | claude-sonnet-5-5 | 2 | 2,485 | 4 | 38,265 | 18 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,992 | 4 | 38,136 | 9 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,663 | 4 | 38,140 | 8 |
| refute:package.json | claude-sonnet-5-5 | 4 | 1,328 | 8 | 110,465 | 12 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,292 | 4 | 38,138 | 23 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 4 | 1,240 | 8 | 79,569 | 678 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 857 | 4 | 38,117 | 6 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 841 | 4 | 38,118 | 83 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 831 | 4 | 38,124 | 7 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 805 | 4 | 38,126 | 277 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 792 | 4 | 38,118 | 6 |
| machine:bash _acceptance/db-thu-tach-khoi-cum-th | claude-haiku-5-5 | 2 | 626 | 4 | 38,135 | 5 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 527 | 4 | 38,119 | 72 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 491 | 4 | 38,118 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 401 | 4 | 33,474 | 4 |


wall: 3287s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 15 | 42,833 | 1,741,140 | 3208 | 21:32:25 | 22:25:53 |
| review | 3 | 26,849 | 2,694,619 | 150 | 21:32:25 | 21:34:55 |
| baseline | 1 | 7,954 | 95,282 | 154 | 21:32:25 | 21:34:59 |
| triage | 1 | 2,485 | 38,265 | 18 | 22:25:53 | 22:26:11 |
| refute | 1 | 1,328 | 110,465 | 12 | 22:26:11 | 22:26:23 |
| capture | 1 | 401 | 33,474 | 4 | 22:26:23 | 22:26:27 |
| synthesize | 1 | 8,613 | 51,829 | 45 | 22:26:27 | 22:27:12 |

- **claude-haiku-5-5**: 15 agent · 55 calls · out 42,833 · in 110 · cache_read 1,741,140 · cache_create 601,003
- **claude-opus-5-5**: 3 agent · 42 calls · out 26,849 · in 84 · cache_read 2,694,619 · cache_create 265,108
- **claude-sonnet-5-5**: 5 agent · 13 calls · out 20,781 · in 26 · cache_read 329,315 · cache_create 235,943

### S4 round 2 — wf_e6d8aaea-21a (22 agent, 102,852 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 32 | 33,490 | 64 | 1,919,175 | 2757 |
| review:bugs | claude-opus-5-5 | 16 | 13,461 | 32 | 1,134,359 | 136 |
| review:conventions | claude-opus-5-5 | 15 | 9,066 | 30 | 938,885 | 91 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 7,954 | 6 | 95,312 | 172 |
| synthesize:report | claude-sonnet-5-5 | 3 | 7,617 | 6 | 112,312 | 46 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 5 | 5,912 | 10 | 160,495 | 319 |
| review:measurement | claude-opus-5-5 | 8 | 5,435 | 16 | 417,384 | 55 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 4 | 5,276 | 8 | 120,620 | 176 |
| triage | claude-sonnet-5-5 | 2 | 3,012 | 4 | 38,860 | 23 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,024 | 4 | 38,151 | 9 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,632 | 4 | 38,155 | 8 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,118 | 4 | 38,153 | 19 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 975 | 4 | 38,133 | 99 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 861 | 4 | 38,139 | 6 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 855 | 4 | 38,132 | 6 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 755 | 4 | 38,133 | 6 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 681 | 4 | 38,133 | 7 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 671 | 4 | 3,381 | 553 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 607 | 4 | 38,141 | 272 |
| machine:bash _acceptance/db-thu-tach-khoi-cum-th | claude-haiku-5-5 | 2 | 528 | 4 | 38,150 | 5 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 520 | 4 | 38,134 | 84 |
| capture:provenance | claude-sonnet-5-5 | 2 | 402 | 4 | 33,489 | 4 |


wall: 4187s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 15 | 55,905 | 2,623,225 | 4113 | 23:25:04 | 00:33:37 |
| review | 3 | 27,962 | 2,490,628 | 142 | 23:25:04 | 23:27:25 |
| baseline | 1 | 7,954 | 95,312 | 172 | 23:25:04 | 23:27:55 |
| triage | 1 | 3,012 | 38,860 | 23 | 00:33:37 | 00:34:00 |
| capture | 1 | 402 | 33,489 | 4 | 00:34:00 | 00:34:04 |
| synthesize | 1 | 7,617 | 112,312 | 46 | 00:34:04 | 00:34:50 |

- **claude-haiku-5-5**: 15 agent · 65 calls · out 55,905 · in 130 · cache_read 2,623,225 · cache_create 622,380
- **claude-opus-5-5**: 3 agent · 39 calls · out 27,962 · in 78 · cache_read 2,490,628 · cache_create 264,053
- **claude-sonnet-5-5**: 4 agent · 10 calls · out 18,985 · in 20 · cache_read 279,973 · cache_create 201,901

