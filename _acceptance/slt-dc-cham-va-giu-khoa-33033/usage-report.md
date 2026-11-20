### S4 round 1 — wf_1cb6b155-12f (20 agent, 114,852 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:bash _acceptance/slt-dc-cham-va-giu-khoa | claude-haiku-5-5 | 17 | 17,988 | 34 | 746,509 | 1504 |
| review:bugs | claude-opus-5-5 | 17 | 15,515 | 34 | 989,533 | 163 |
| review:measurement | claude-opus-5-5 | 15 | 14,792 | 30 | 1,037,555 | 155 |
| review:conventions | claude-opus-5-5 | 19 | 14,689 | 38 | 1,475,313 | 155 |
| machine:bash db/db-thu.sh oneinvest_suite_trtd - | claude-haiku-5-5 | 8 | 8,471 | 16 | 281,267 | 536 |
| machine:bash _acceptance/slt-dc-cham-va-giu-khoa | claude-haiku-5-5 | 7 | 7,789 | 14 | 236,071 | 448 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,905 | 4 | 46,513 | 41 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 5,650 | 6 | 85,696 | 43 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 8 | 5,303 | 16 | 226,654 | 1057 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,692 | 4 | 34,674 | 104 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,565 | 4 | 6,600 | 556 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,925 | 4 | 34,684 | 7 |
| triage | claude-sonnet-5-5 | 2 | 1,850 | 4 | 33,984 | 14 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 5 | 1,816 | 10 | 109,697 | 712 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,734 | 4 | 34,688 | 8 |
| machine:bash db/db-thu.sh oneinvest_suite_trt -- | claude-haiku-5-5 | 2 | 1,542 | 4 | 34,704 | 48 |
| machine:bash _acceptance/slt-dc-cham-va-giu-khoa | claude-haiku-5-5 | 2 | 1,225 | 4 | 34,685 | 6 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,090 | 4 | 34,686 | 17 |
| refute:transform-zalo-loai-tin-doi-chieu.test.mjs | claude-sonnet-5-5 | 3 | 990 | 6 | 66,295 | 9 |
| capture:provenance | claude-sonnet-5-5 | 2 | 321 | 4 | 30,131 | 4 |


wall: 2530s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 12 | 54,140 | 1,814,919 | 2461 | 11:46:22 | 12:27:23 |
| review | 3 | 44,996 | 3,502,401 | 163 | 11:46:22 | 11:49:05 |
| baseline | 1 | 5,650 | 85,696 | 43 | 11:46:22 | 11:47:05 |
| triage | 1 | 1,850 | 33,984 | 14 | 12:27:23 | 12:27:37 |
| refute | 1 | 990 | 66,295 | 9 | 12:27:37 | 12:27:46 |
| capture | 1 | 321 | 30,131 | 4 | 12:27:46 | 12:27:50 |
| synthesize | 1 | 6,905 | 46,513 | 41 | 12:27:50 | 12:28:32 |

- **claude-haiku-5-5**: 12 agent · 59 calls · out 54,140 · in 118 · cache_read 1,814,919 · cache_create 528,021
- **claude-opus-5-5**: 3 agent · 51 calls · out 44,996 · in 102 · cache_read 3,502,401 · cache_create 300,312
- **claude-sonnet-5-5**: 5 agent · 12 calls · out 15,716 · in 24 · cache_read 262,619 · cache_create 211,451

### S4 round 2 — wf_2ee1dde1-094 (17 agent, 81,340 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:bash _acceptance/slt-dc-cham-va-giu-khoa | claude-haiku-5-5 | 18 | 20,206 | 36 | 794,479 | 1580 |
| review:conventions | claude-opus-5-5 | 16 | 9,253 | 32 | 929,322 | 98 |
| review:bugs | claude-opus-5-5 | 17 | 8,713 | 34 | 896,323 | 91 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 13 | 8,285 | 26 | 418,154 | 1379 |
| synthesize:report | claude-sonnet-5-5 | 6 | 6,312 | 12 | 276,662 | 52 |
| review:measurement | claude-opus-5-5 | 8 | 4,667 | 16 | 346,036 | 50 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,387 | 6 | 78,627 | 25 |
| machine:bash _acceptance/slt-dc-cham-va-giu-khoa | claude-haiku-5-5 | 7 | 3,334 | 14 | 228,404 | 365 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 7 | 3,148 | 14 | 184,504 | 1078 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,750 | 4 | 31,347 | 75 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,483 | 4 | 3,300 | 516 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,087 | 4 | 34,657 | 9 |
| machine:bash _acceptance/slt-dc-cham-va-giu-khoa | claude-haiku-5-5 | 2 | 2,059 | 4 | 34,658 | 8 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,302 | 4 | 34,659 | 19 |
| triage | claude-sonnet-5-5 | 2 | 1,204 | 4 | 33,472 | 18 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 751 | 4 | 34,661 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 399 | 4 | 30,104 | 17 |


wall: 5112s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 10 | 46,405 | 1,798,823 | 5026 | 12:37:32 | 14:01:18 |
| review | 3 | 22,633 | 2,171,681 | 98 | 12:37:32 | 12:39:09 |
| baseline | 1 | 4,387 | 78,627 | 25 | 12:37:32 | 12:37:57 |
| triage | 1 | 1,204 | 33,472 | 18 | 14:01:18 | 14:01:36 |
| capture | 1 | 399 | 30,104 | 17 | 14:01:36 | 14:01:52 |
| synthesize | 1 | 6,312 | 276,662 | 52 | 14:01:52 | 14:02:44 |

- **claude-haiku-5-5**: 10 agent · 57 calls · out 46,405 · in 114 · cache_read 1,798,823 · cache_create 467,801
- **claude-opus-5-5**: 3 agent · 41 calls · out 22,633 · in 82 · cache_read 2,171,681 · cache_create 222,375
- **claude-sonnet-5-5**: 4 agent · 13 calls · out 12,302 · in 26 · cache_read 418,865 · cache_create 178,062

### S4 round 3 — wf_60131994-3a8 (17 agent, 75,495 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 25 | 20,157 | 50 | 1,944,845 | 214 |
| review:measurement | claude-opus-5-5 | 8 | 8,995 | 16 | 385,613 | 96 |
| review:conventions | claude-opus-5-5 | 12 | 6,077 | 24 | 578,701 | 65 |
| machine:bash _acceptance/slt-dc-cham-va-giu-khoa | claude-haiku-5-5 | 5 | 5,864 | 10 | 152,346 | 293 |
| synthesize:report | claude-sonnet-5-5 | 5 | 5,814 | 10 | 206,312 | 34 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 11 | 5,666 | 22 | 335,455 | 1287 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 8 | 5,519 | 16 | 220,126 | 1004 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 5,444 | 6 | 81,910 | 135 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,765 | 4 | 34,688 | 78 |
| machine:bash db/db-thu.sh oneinvest_suite_trt -- | claude-haiku-5-5 | 2 | 1,682 | 4 | 34,718 | 32 |
| machine:bash _acceptance/slt-dc-cham-va-giu-khoa | claude-haiku-5-5 | 2 | 1,475 | 4 | 34,699 | 7 |
| triage | claude-sonnet-5-5 | 2 | 1,251 | 4 | 33,311 | 11 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,205 | 4 | 34,700 | 18 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,184 | 4 | 34,702 | 6 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,167 | 4 | 34,698 | 6 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 907 | 4 | 3,300 | 533 |
| capture:provenance | claude-sonnet-5-5 | 2 | 323 | 4 | 30,145 | 3 |


wall: 3275s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 35,229 | 2,909,159 | 215 | 14:09:13 | 14:12:47 |
| machine | 10 | 27,434 | 919,432 | 3226 | 14:09:13 | 15:02:58 |
| baseline | 1 | 5,444 | 81,910 | 135 | 14:09:13 | 14:11:28 |
| triage | 1 | 1,251 | 33,311 | 11 | 15:02:58 | 15:03:10 |
| capture | 1 | 323 | 30,145 | 3 | 15:03:10 | 15:03:13 |
| synthesize | 1 | 5,814 | 206,312 | 34 | 15:03:13 | 15:03:47 |

- **claude-opus-5-5**: 3 agent · 45 calls · out 35,229 · in 90 · cache_read 2,909,159 · cache_create 252,045
- **claude-haiku-5-5**: 10 agent · 38 calls · out 27,434 · in 76 · cache_read 919,432 · cache_create 438,485
- **claude-sonnet-5-5**: 4 agent · 12 calls · out 12,832 · in 24 · cache_read 351,678 · cache_create 175,722

