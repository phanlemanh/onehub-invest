### S4 wf_d062ff6a-0d5 — wf_d062ff6a-0d5 (21 agent, 110,479 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 27 | 20,275 | 54 | 2,512,519 | 354 |
| review:conventions | claude-opus-5-5 | 30 | 16,730 | 60 | 2,804,111 | 191 |
| review:measurement | claude-opus-5-5 | 12 | 16,639 | 24 | 949,336 | 173 |
| synthesize:report | claude-sonnet-5-5 | 2 | 7,986 | 4 | 49,880 | 44 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 6,496 | 6 | 93,083 | 52 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 5 | 6,130 | 10 | 165,278 | 268 |
| machine:cd pipeline && node --test scripts/do-ti | claude-haiku-5-5 | 6 | 6,116 | 12 | 212,417 | 418 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 4 | 5,153 | 8 | 124,288 | 141 |
| judge:E6:spec-alignment | claude-sonnet-5-5 | 3 | 3,429 | 6 | 86,189 | 27 |
| judge:E6:operational-feasibility | claude-sonnet-5-5 | 2 | 2,992 | 4 | 38,898 | 24 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 4 | 2,901 | 8 | 81,799 | 629 |
| judge:E6:domain-correctness | claude-sonnet-5-5 | 3 | 2,827 | 6 | 82,573 | 23 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,827 | 4 | 6,994 | 594 |
| machine:git diff a94013aaf702d8c23907ee68b54e9c7 | claude-haiku-5-5 | 5 | 2,446 | 10 | 126,211 | 763 |
| triage | claude-sonnet-5-5 | 2 | 2,316 | 4 | 38,673 | 17 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,289 | 4 | 39,321 | 24 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,010 | 4 | 39,323 | 6 |
| machine:set -o pipefail; cd pipeline && bash ../ | claude-haiku-5-5 | 2 | 952 | 4 | 39,460 | 89 |
| machine:node --test pipeline/scripts/s03-thu-lai | claude-haiku-5-5 | 2 | 896 | 4 | 39,310 | 5 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 731 | 4 | 39,319 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 338 | 4 | 34,554 | 4 |


wall: 1732s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 6,496 | 93,083 | 52 | 02:05:27 | 02:06:18 |
| review | 3 | 53,644 | 6,265,966 | 361 | 02:05:27 | 02:11:28 |
| machine | 11 | 30,451 | 913,720 | 1667 | 02:05:27 | 02:33:13 |
| judge | 3 | 9,248 | 207,660 | 29 | 02:05:27 | 02:05:55 |
| triage | 1 | 2,316 | 38,673 | 17 | 02:33:13 | 02:33:31 |
| capture | 1 | 338 | 34,554 | 4 | 02:33:31 | 02:33:34 |
| synthesize | 1 | 7,986 | 49,880 | 44 | 02:33:34 | 02:34:19 |

- **claude-opus-5-5**: 3 agent · 69 calls · out 53,644 · in 138 · cache_read 6,265,966 · cache_create 359,587
- **claude-sonnet-5-5**: 7 agent · 17 calls · out 26,384 · in 34 · cache_read 423,850 · cache_create 333,834
- **claude-haiku-5-5**: 11 agent · 36 calls · out 30,451 · in 72 · cache_read 913,720 · cache_create 524,173

### S4 wf_f14d004f-057 — wf_f14d004f-057 (22 agent, 97,486 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 19 | 17,781 | 38 | 1,780,551 | 191 |
| review:measurement | claude-opus-5-5 | 9 | 13,686 | 18 | 542,446 | 139 |
| review:bugs | claude-opus-5-5 | 23 | 13,660 | 46 | 1,842,532 | 157 |
| synthesize:report | claude-sonnet-5-5 | 2 | 9,251 | 4 | 53,679 | 49 |
| machine:cd pipeline && node --test scripts/do-ti | claude-haiku-5-5 | 6 | 6,759 | 12 | 213,747 | 400 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 5 | 6,241 | 10 | 165,420 | 266 |
| triage | claude-sonnet-5-5 | 2 | 3,628 | 4 | 41,386 | 25 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 4 | 3,558 | 8 | 124,704 | 133 |
| judge:E6:domain-correctness | claude-sonnet-5-5 | 2 | 3,422 | 4 | 35,361 | 27 |
| judge:E6:operational-feasibility | claude-sonnet-5-5 | 2 | 3,238 | 4 | 38,979 | 27 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,759 | 4 | 6,994 | 549 |
| judge:E6:spec-alignment | claude-sonnet-5-5 | 2 | 2,592 | 4 | 38,977 | 22 |
| machine:git diff a94013aaf702d8c23907ee68b54e9c7 | claude-haiku-5-5 | 5 | 2,103 | 10 | 126,262 | 730 |
| refute:s03-thu-lai-tin-roi-oan.test.mjs | claude-sonnet-5-5 | 5 | 1,948 | 10 | 154,029 | 18 |
| refute:do-tin-roi-oan.test.mjs | claude-sonnet-5-5 | 4 | 1,467 | 8 | 114,386 | 12 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,296 | 4 | 39,402 | 20 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 969 | 4 | 3,497 | 581 |
| machine:set -o pipefail; cd pipeline && bash ../ | claude-haiku-5-5 | 2 | 866 | 4 | 39,541 | 85 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 723 | 4 | 39,400 | 4 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 682 | 4 | 39,404 | 5 |
| machine:node --test pipeline/scripts/s03-thu-lai | claude-haiku-5-5 | 2 | 512 | 4 | 39,391 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 345 | 4 | 34,635 | 4 |


wall: 1655s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 45,127 | 4,165,529 | 191 | 02:50:53 | 02:54:04 |
| machine | 11 | 26,468 | 837,762 | 1559 | 02:50:53 | 03:16:52 |
| judge | 3 | 9,252 | 113,317 | 28 | 02:50:53 | 02:51:22 |
| triage | 1 | 3,628 | 41,386 | 25 | 03:16:52 | 03:17:17 |
| refute | 2 | 3,415 | 268,415 | 19 | 03:17:17 | 03:17:36 |
| capture | 1 | 345 | 34,635 | 4 | 03:17:36 | 03:17:39 |
| synthesize | 1 | 9,251 | 53,679 | 49 | 03:17:39 | 03:18:29 |

- **claude-opus-5-5**: 3 agent · 51 calls · out 45,127 · in 102 · cache_read 4,165,529 · cache_create 350,129
- **claude-sonnet-5-5**: 8 agent · 21 calls · out 25,891 · in 42 · cache_read 511,432 · cache_create 363,175
- **claude-haiku-5-5**: 11 agent · 34 calls · out 26,468 · in 68 · cache_read 837,762 · cache_create 523,170

### S4 wf_fb55ca46-0fe — wf_fb55ca46-0fe (21 agent, 122,384 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 41 | 33,871 | 82 | 4,431,562 | 380 |
| review:measurement | claude-opus-5-5 | 16 | 21,403 | 32 | 1,243,923 | 217 |
| review:conventions | claude-opus-5-5 | 22 | 16,557 | 44 | 1,965,061 | 181 |
| synthesize:report | claude-sonnet-5-5 | 2 | 9,361 | 4 | 53,833 | 49 |
| machine:cd pipeline && node --test scripts/do-ti | claude-haiku-5-5 | 6 | 5,880 | 12 | 213,643 | 380 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 5 | 5,691 | 10 | 165,294 | 265 |
| judge:E6:domain-correctness | claude-sonnet-5-5 | 3 | 3,894 | 6 | 83,149 | 30 |
| triage | claude-sonnet-5-5 | 2 | 3,893 | 4 | 42,364 | 27 |
| judge:E6:operational-feasibility | claude-sonnet-5-5 | 3 | 3,525 | 6 | 86,769 | 28 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 4 | 3,340 | 8 | 125,077 | 130 |
| machine:git diff a94013aaf702d8c23907ee68b54e9c7 | claude-haiku-5-5 | 5 | 2,970 | 10 | 127,242 | 733 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,500 | 4 | 3,497 | 582 |
| judge:E6:spec-alignment | claude-sonnet-5-5 | 2 | 2,465 | 4 | 39,062 | 20 |
| refute:s03-thu-lai-tin-roi-oan.test.mjs | claude-sonnet-5-5 | 4 | 1,616 | 8 | 118,039 | 13 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,225 | 4 | 39,487 | 19 |
| machine:node --test pipeline/scripts/s03-thu-lai | claude-haiku-5-5 | 2 | 966 | 4 | 39,476 | 6 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 837 | 4 | 39,489 | 5 |
| machine:set -o pipefail; cd pipeline && bash ../ | claude-haiku-5-5 | 2 | 828 | 4 | 39,626 | 88 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 671 | 4 | 39,485 | 4 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 557 | 4 | 6,994 | 539 |
| capture:provenance | claude-sonnet-5-5 | 2 | 334 | 4 | 34,720 | 3 |


wall: 1636s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 11 | 25,465 | 839,310 | 1544 | 04:21:31 | 04:47:15 |
| review | 3 | 71,831 | 7,640,546 | 382 | 04:21:31 | 04:27:53 |
| judge | 3 | 9,884 | 208,980 | 30 | 04:21:31 | 04:22:01 |
| triage | 1 | 3,893 | 42,364 | 27 | 04:47:15 | 04:47:42 |
| refute | 1 | 1,616 | 118,039 | 13 | 04:47:42 | 04:47:55 |
| capture | 1 | 334 | 34,720 | 3 | 04:47:55 | 04:47:58 |
| synthesize | 1 | 9,361 | 53,833 | 49 | 04:47:58 | 04:48:47 |

- **claude-opus-5-5**: 3 agent · 79 calls · out 71,831 · in 158 · cache_read 7,640,546 · cache_create 396,314
- **claude-sonnet-5-5**: 7 agent · 18 calls · out 25,088 · in 36 · cache_read 457,936 · cache_create 336,527
- **claude-haiku-5-5**: 11 agent · 34 calls · out 25,465 · in 68 · cache_read 839,310 · cache_create 525,747

