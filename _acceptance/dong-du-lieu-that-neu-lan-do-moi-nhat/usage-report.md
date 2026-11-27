### S4 round 1 (chấm trên M5) — wf_1d756b0e-3da (16 agent, 42,000 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 8 | 7,346 | 16 | 336,358 | 71 |
| review:conventions | claude-opus-5-5 | 9 | 6,917 | 18 | 405,201 | 68 |
| synthesize:report | claude-sonnet-5-5 | 2 | 5,697 | 4 | 47,699 | 31 |
| review:measurement | claude-opus-5-5 | 8 | 5,605 | 16 | 332,704 | 54 |
| triage | claude-sonnet-5-5 | 2 | 3,287 | 4 | 37,719 | 23 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 2,939 | 6 | 78,227 | 20 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,991 | 4 | 36,490 | 8 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 1,924 | 4 | 36,489 | 11 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 1,615 | 4 | 36,481 | 84 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,150 | 4 | 36,492 | 24 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 723 | 4 | 33,099 | 140 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 670 | 4 | 36,494 | 5 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 613 | 4 | 36,489 | 205 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 560 | 4 | 36,478 | 5 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 533 | 4 | 36,489 | 121 |
| capture:provenance | claude-sonnet-5-5 | 2 | 430 | 4 | 31,831 | 5 |


wall: 657s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,939 | 78,227 | 20 | 02:32:47 | 02:33:08 |
| machine | 9 | 9,779 | 325,001 | 598 | 02:32:47 | 02:42:46 |
| review | 3 | 19,868 | 1,074,263 | 72 | 02:32:47 | 02:33:59 |
| triage | 1 | 3,287 | 37,719 | 23 | 02:42:46 | 02:43:08 |
| capture | 1 | 430 | 31,831 | 5 | 02:43:08 | 02:43:13 |
| synthesize | 1 | 5,697 | 47,699 | 31 | 02:43:13 | 02:43:45 |

- **claude-opus-5-5**: 3 agent · 25 calls · out 19,868 · in 50 · cache_read 1,074,263 · cache_create 172,833
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 12,353 · in 18 · cache_read 195,476 · cache_create 178,105
- **claude-haiku-5-5**: 9 agent · 18 calls · out 9,779 · in 36 · cache_read 325,001 · cache_create 312,568

### S4 round 2 (chấm trên M5, DB đầy đủ) — wf_73a1a03b-f91 (15 agent, 34,275 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 12 | 5,212 | 24 | 346,940 | 1945 |
| synthesize:report | claude-sonnet-5-5 | 2 | 4,455 | 4 | 45,691 | 28 |
| review:measurement | claude-opus-5-5 | 8 | 4,340 | 16 | 344,791 | 60 |
| review:bugs | claude-opus-5-5 | 6 | 3,561 | 12 | 222,392 | 45 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,012 | 6 | 78,268 | 21 |
| review:conventions | claude-opus-5-5 | 10 | 2,945 | 20 | 405,303 | 49 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 2,504 | 4 | 36,489 | 231 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,330 | 4 | 6,762 | 544 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,299 | 4 | 36,492 | 24 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,224 | 4 | 36,490 | 7 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 846 | 4 | 36,480 | 248 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 760 | 4 | 36,489 | 120 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 700 | 4 | 36,494 | 6 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 664 | 4 | 36,478 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 423 | 4 | 35,046 | 4 |


wall: 3157s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,012 | 78,268 | 21 | 05:47:17 | 05:47:38 |
| machine | 9 | 15,539 | 609,114 | 3125 | 05:47:17 | 06:39:22 |
| review | 3 | 10,846 | 972,486 | 62 | 05:47:17 | 05:48:20 |
| capture | 1 | 423 | 35,046 | 4 | 06:39:22 | 06:39:27 |
| synthesize | 1 | 4,455 | 45,691 | 28 | 06:39:27 | 06:39:54 |

- **claude-haiku-5-5**: 9 agent · 28 calls · out 15,539 · in 56 · cache_read 609,114 · cache_create 473,608
- **claude-sonnet-5-5**: 3 agent · 7 calls · out 7,890 · in 14 · cache_read 159,005 · cache_create 123,528
- **claude-opus-5-5**: 3 agent · 24 calls · out 10,846 · in 48 · cache_read 972,486 · cache_create 172,762

