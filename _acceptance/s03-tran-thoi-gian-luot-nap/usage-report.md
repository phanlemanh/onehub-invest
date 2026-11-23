### S4 round 2 — wf_2be1872f-f1a (26 agent, 80,458 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 2 | 9,709 | 4 | 52,440 | 52 |
| review:measurement | claude-opus-5-5 | 13 | 8,610 | 28 | 862,425 | 90 |
| review:conventions | claude-opus-5-5 | 15 | 7,954 | 30 | 1,108,760 | 175 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 7,150 | 6 | 86,267 | 86 |
| review:bugs | claude-opus-5-5 | 10 | 6,645 | 20 | 578,404 | 72 |
| machine:bash _acceptance/s03-tran-thoi-gian-luot | claude-haiku-5-5 | 11 | 5,732 | 22 | 341,235 | 1172 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 7 | 5,239 | 14 | 188,884 | 932 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 11 | 4,485 | 22 | 337,444 | 1405 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,550 | 4 | 6,600 | 550 |
| triage | claude-sonnet-5-5 | 2 | 2,234 | 4 | 36,006 | 15 |
| machine:bash _acceptance/s03-tran-thoi-gian-luot | claude-haiku-5-5 | 2 | 2,165 | 4 | 34,444 | 64 |
| machine:bash _acceptance/s03-tran-thoi-gian-luot | claude-haiku-5-5 | 2 | 2,117 | 4 | 34,441 | 64 |
| machine:node --test scripts/job-exit.test.mjs sc | claude-haiku-5-5 | 2 | 1,857 | 4 | 34,493 | 28 |
| machine:node --test scripts/zalo-import-job-lan. | claude-haiku-5-5 | 2 | 1,770 | 4 | 34,421 | 35 |
| machine:node --test scripts/job-step-thoi-luong. | claude-haiku-5-5 | 2 | 1,721 | 4 | 34,421 | 27 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,351 | 4 | 34,446 | 21 |
| refute:do-luot-dem.sh | claude-sonnet-5-5 | 3 | 1,332 | 6 | 68,793 | 11 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,298 | 4 | 34,444 | 6 |
| refute:zalo-import-tran.test.mjs | claude-sonnet-5-5 | 3 | 1,186 | 6 | 67,713 | 11 |
| refute:zalo-import-tran-zcode.test.mjs | claude-sonnet-5-5 | 4 | 1,137 | 8 | 101,844 | 10 |
| machine:bash _acceptance/s03-tran-thoi-gian-luot | claude-haiku-5-5 | 2 | 904 | 4 | 34,450 | 6 |
| machine:bash db/db-thu.sh oneinvest_suite_zik -- | claude-haiku-5-5 | 2 | 904 | 4 | 3,300 | 458 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 901 | 4 | 34,448 | 5 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 832 | 4 | 31,134 | 104 |
| refute:zalo-import-job.test.mjs | claude-sonnet-5-5 | 2 | 359 | 4 | 33,228 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 316 | 4 | 29,886 | 3 |


wall: 3107s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 23,209 | 2,549,589 | 175 | 17:21:27 | 17:24:23 |
| baseline | 1 | 7,150 | 86,267 | 86 | 17:21:27 | 17:22:53 |
| machine | 15 | 33,826 | 1,218,605 | 3024 | 17:21:27 | 18:11:52 |
| triage | 1 | 2,234 | 36,006 | 15 | 18:11:52 | 18:12:07 |
| refute | 4 | 4,014 | 271,578 | 12 | 18:12:07 | 18:12:19 |
| capture | 1 | 316 | 29,886 | 3 | 18:12:19 | 18:12:22 |
| synthesize | 1 | 9,709 | 52,440 | 52 | 18:12:22 | 18:13:14 |

- **claude-sonnet-5-5**: 8 agent · 21 calls · out 23,423 · in 42 · cache_read 476,177 · cache_create 322,321
- **claude-opus-5-5**: 3 agent · 38 calls · out 23,209 · in 78 · cache_read 2,549,589 · cache_create 272,779
- **claude-haiku-5-5**: 15 agent · 53 calls · out 33,826 · in 106 · cache_read 1,218,605 · cache_create 646,277

### S4 round 3 — wf_85e5056a-b4d (21 agent, 66,077 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 10 | 8,146 | 22 | 484,758 | 99 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 17 | 7,955 | 34 | 587,802 | 1717 |
| review:measurement | claude-opus-5-5 | 12 | 7,512 | 26 | 641,315 | 96 |
| synthesize:report | claude-sonnet-5-5 | 2 | 7,137 | 4 | 47,358 | 39 |
| machine:bash _acceptance/s03-tran-thoi-gian-luot | claude-haiku-5-5 | 13 | 6,791 | 26 | 416,689 | 1536 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 9 | 5,406 | 18 | 260,137 | 1047 |
| review:conventions | claude-opus-5-5 | 7 | 5,124 | 14 | 300,123 | 61 |
| machine:node --test scripts/job-exit.test.mjs sc | claude-haiku-5-5 | 2 | 2,544 | 4 | 35,211 | 34 |
| machine:bash _acceptance/s03-tran-thoi-gian-luot | claude-haiku-5-5 | 2 | 2,532 | 4 | 35,159 | 71 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 3 | 1,916 | 6 | 41,911 | 613 |
| triage | claude-sonnet-5-5 | 2 | 1,706 | 4 | 35,152 | 13 |
| machine:node --test scripts/job-step-thoi-luong. | claude-haiku-5-5 | 2 | 1,696 | 4 | 35,139 | 31 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,196 | 4 | 35,164 | 27 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 972 | 4 | 35,162 | 5 |
| machine:bash db/db-thu.sh oneinvest_suite_zik -- | claude-haiku-5-5 | 2 | 950 | 4 | 6,600 | 489 |
| machine:bash _acceptance/s03-tran-thoi-gian-luot | claude-haiku-5-5 | 2 | 915 | 4 | 35,168 | 9 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 869 | 4 | 31,852 | 161 |
| machine:node --test scripts/zalo-import-job-lan. | claude-haiku-5-5 | 2 | 835 | 4 | 35,139 | 46 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 748 | 4 | 35,166 | 4 |
| machine:bash _acceptance/s03-tran-thoi-gian-luot | claude-haiku-5-5 | 2 | 737 | 4 | 35,162 | 66 |
| capture:provenance | claude-sonnet-5-5 | 2 | 390 | 4 | 30,604 | 3 |


wall: 3630s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 20,782 | 1,426,196 | 101 | 08:19:39 | 08:21:20 |
| machine | 15 | 36,062 | 1,661,461 | 3575 | 08:19:39 | 09:19:14 |
| triage | 1 | 1,706 | 35,152 | 13 | 09:19:14 | 09:19:27 |
| capture | 1 | 390 | 30,604 | 3 | 09:19:27 | 09:19:30 |
| synthesize | 1 | 7,137 | 47,358 | 39 | 09:19:30 | 09:20:09 |

- **claude-opus-5-5**: 3 agent · 29 calls · out 20,782 · in 62 · cache_read 1,426,196 · cache_create 207,402
- **claude-haiku-5-5**: 15 agent · 64 calls · out 36,062 · in 128 · cache_read 1,661,461 · cache_create 660,117
- **claude-sonnet-5-5**: 3 agent · 6 calls · out 9,233 · in 12 · cache_read 113,114 · cache_create 134,872

