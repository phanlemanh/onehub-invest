### S4 round 1 — wf_5c3c8535-39e (23 agent, 57,691 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 2 | 9,074 | 4 | 52,551 | 48 |
| review:measurement | claude-opus-5-5 | 7 | 8,439 | 14 | 331,967 | 91 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 8,132 | 6 | 90,656 | 43 |
| review:bugs | claude-opus-5-5 | 9 | 6,235 | 20 | 463,750 | 74 |
| review:conventions | claude-opus-5-5 | 9 | 5,944 | 18 | 488,166 | 71 |
| triage | claude-sonnet-5-5 | 2 | 3,297 | 4 | 35,942 | 23 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,119 | 4 | 32,164 | 155 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 1,444 | 4 | 35,473 | 101 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 1,402 | 4 | 35,465 | 17 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,328 | 4 | 35,476 | 9 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 1,319 | 4 | 35,473 | 19 |
| machine:bash _acceptance/cham-bong-cau-tra-loi-k | claude-haiku-5-5 | 2 | 951 | 4 | 35,478 | 13 |
| machine:bash _acceptance/cham-bong-cau-tra-loi-k | claude-haiku-5-5 | 2 | 908 | 4 | 35,478 | 11 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 881 | 4 | 35,474 | 7 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 810 | 4 | 35,478 | 8 |
| machine:bash _acceptance/cham-bong-cau-tra-loi-k | claude-haiku-5-5 | 2 | 771 | 4 | 35,476 | 9 |
| machine:bash _acceptance/cham-bong-cau-tra-loi-k | claude-haiku-5-5 | 2 | 769 | 4 | 35,478 | 11 |
| machine:bash _acceptance/cham-bong-cau-tra-loi-k | claude-haiku-5-5 | 2 | 741 | 4 | 35,478 | 8 |
| machine:bash _acceptance/cham-bong-cau-tra-loi-k | claude-haiku-5-5 | 2 | 739 | 4 | 35,478 | 11 |
| machine:bash _acceptance/cham-bong-cau-tra-loi-k | claude-haiku-5-5 | 3 | 738 | 8 | 70,917 | 13 |
| machine:bash _acceptance/cham-bong-cau-tra-loi-k | claude-haiku-5-5 | 2 | 703 | 4 | 35,478 | 11 |
| machine:bash _acceptance/cham-bong-cau-tra-loi-k | claude-haiku-5-5 | 2 | 585 | 4 | 35,478 | 10 |
| capture:provenance | claude-sonnet-5-5 | 2 | 362 | 4 | 30,935 | 3 |


wall: 392s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 8,132 | 90,656 | 43 | 06:28:39 | 06:29:22 |
| review | 3 | 20,618 | 1,283,883 | 93 | 06:28:39 | 06:30:12 |
| machine | 16 | 16,208 | 599,742 | 317 | 06:28:39 | 06:33:56 |
| triage | 1 | 3,297 | 35,942 | 23 | 06:33:56 | 06:34:19 |
| capture | 1 | 362 | 30,935 | 3 | 06:34:19 | 06:34:23 |
| synthesize | 1 | 9,074 | 52,551 | 48 | 06:34:23 | 06:35:11 |

- **claude-sonnet-5-5**: 4 agent · 9 calls · out 20,865 · in 18 · cache_read 210,084 · cache_create 190,178
- **claude-opus-5-5**: 3 agent · 25 calls · out 20,618 · in 52 · cache_read 1,283,883 · cache_create 214,608
- **claude-haiku-5-5**: 16 agent · 33 calls · out 16,208 · in 68 · cache_read 599,742 · cache_create 520,016

### S4 round 2 — wf_2f18f57c-0d6 (12 agent, 27,318 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 6 | 5,565 | 12 | 285,242 | 34 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 10 | 4,701 | 20 | 267,924 | 1498 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 8 | 3,615 | 16 | 226,156 | 1149 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,728 | 4 | 35,482 | 151 |
| review:bugs | claude-opus-5-5 | 6 | 2,522 | 12 | 193,877 | 32 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,126 | 4 | 3,300 | 541 |
| review:conventions | claude-opus-5-5 | 5 | 1,652 | 10 | 148,816 | 23 |
| review:measurement | claude-opus-5-5 | 4 | 1,260 | 8 | 111,192 | 18 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,102 | 4 | 35,494 | 17 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 949 | 4 | 35,492 | 7 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 736 | 4 | 35,496 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 362 | 4 | 30,953 | 3 |


wall: 3406s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 7 | 15,957 | 639,344 | 3369 | 06:38:51 | 07:35:00 |
| review | 3 | 5,434 | 453,885 | 35 | 06:38:51 | 06:39:26 |
| capture | 1 | 362 | 30,953 | 3 | 07:35:00 | 07:35:03 |
| synthesize | 1 | 5,565 | 285,242 | 34 | 07:35:03 | 07:35:37 |

- **claude-sonnet-5-5**: 2 agent · 8 calls · out 5,927 · in 16 · cache_read 316,195 · cache_create 95,953
- **claude-haiku-5-5**: 7 agent · 28 calls · out 15,957 · in 56 · cache_read 639,344 · cache_create 371,953
- **claude-opus-5-5**: 3 agent · 15 calls · out 5,434 · in 30 · cache_read 453,885 · cache_create 128,288

### S4 round 3 — wf_26edcd76-917 (14 agent, 66,808 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 27 | 26,937 | 54 | 1,405,410 | 2594 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 14 | 15,332 | 28 | 591,727 | 1269 |
| synthesize:report | claude-sonnet-5-5 | 3 | 5,112 | 6 | 102,009 | 30 |
| review:bugs | claude-opus-5-5 | 9 | 4,236 | 18 | 401,121 | 47 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,746 | 6 | 115,452 | 166 |
| review:conventions | claude-opus-5-5 | 7 | 2,624 | 14 | 255,218 | 28 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,552 | 4 | 3,381 | 537 |
| review:measurement | claude-opus-5-5 | 4 | 1,371 | 8 | 116,875 | 17 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,298 | 4 | 36,026 | 30 |
| triage | claude-sonnet-5-5 | 2 | 1,223 | 4 | 33,882 | 11 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 780 | 4 | 36,024 | 6 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 653 | 4 | 36,028 | 5 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 579 | 4 | 36,014 | 167 |
| capture:provenance | claude-sonnet-5-5 | 2 | 365 | 4 | 31,381 | 5 |


wall: 4654s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 7 | 48,131 | 2,144,610 | 4608 | 07:42:04 | 08:58:53 |
| review | 3 | 8,231 | 773,214 | 47 | 07:42:04 | 07:42:51 |
| baseline | 1 | 3,746 | 115,452 | 166 | 07:42:04 | 07:44:51 |
| triage | 1 | 1,223 | 33,882 | 11 | 08:58:53 | 08:59:03 |
| capture | 1 | 365 | 31,381 | 5 | 08:59:03 | 08:59:08 |
| synthesize | 1 | 5,112 | 102,009 | 30 | 08:59:08 | 08:59:38 |

- **claude-haiku-5-5**: 7 agent · 51 calls · out 48,131 · in 102 · cache_read 2,144,610 · cache_create 288,520
- **claude-sonnet-5-5**: 4 agent · 10 calls · out 10,446 · in 20 · cache_read 282,724 · cache_create 136,499
- **claude-opus-5-5**: 3 agent · 20 calls · out 8,231 · in 40 · cache_read 773,214 · cache_create 145,814

