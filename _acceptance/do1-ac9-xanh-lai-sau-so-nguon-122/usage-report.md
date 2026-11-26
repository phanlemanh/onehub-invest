### S4 round 1 (chấm trên M5) — wf_d693ae29-420 (20 agent, 65,662 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 19 | 8,707 | 38 | 745,646 | 1868 |
| review:bugs | claude-opus-5-5 | 10 | 7,676 | 20 | 458,157 | 90 |
| synthesize:report | claude-sonnet-5-5 | 2 | 7,486 | 4 | 46,375 | 41 |
| review:conventions | claude-opus-5-5 | 10 | 6,304 | 20 | 475,421 | 77 |
| review:measurement | claude-opus-5-5 | 9 | 5,593 | 18 | 412,652 | 68 |
| machine:bash db/db-thu.sh oneinvest_suite_ht31dc | claude-haiku-5-5 | 6 | 5,519 | 12 | 201,037 | 398 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,334 | 6 | 81,978 | 55 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 6 | 3,719 | 12 | 156,729 | 857 |
| machine:bash db/db-thu.sh oneinvest_suite_ht31 - | claude-haiku-5-5 | 4 | 3,211 | 8 | 117,267 | 181 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 3,030 | 4 | 36,489 | 175 |
| triage | claude-sonnet-5-5 | 2 | 1,685 | 4 | 36,653 | 12 |
| refute:doi-chung.mjs | claude-sonnet-5-5 | 5 | 1,489 | 10 | 155,048 | 14 |
| refute:doi-chung.mjs | claude-sonnet-5-5 | 4 | 1,466 | 8 | 113,493 | 13 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,315 | 4 | 36,492 | 43 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 821 | 4 | 6,762 | 339 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 800 | 4 | 36,490 | 6 |
| machine:bash _acceptance/do1-ac9-xanh-lai-sau-so | claude-haiku-5-5 | 2 | 768 | 4 | 36,496 | 6 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 717 | 4 | 6,762 | 350 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 681 | 4 | 36,494 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 341 | 4 | 31,831 | 5 |


wall: 3717s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,334 | 81,978 | 55 | 06:44:55 | 06:45:50 |
| machine | 11 | 29,288 | 1,416,664 | 3644 | 06:44:55 | 07:45:39 |
| review | 3 | 19,573 | 1,346,230 | 93 | 06:44:55 | 06:46:28 |
| triage | 1 | 1,685 | 36,653 | 12 | 07:45:39 | 07:45:52 |
| refute | 2 | 2,955 | 268,541 | 15 | 07:45:52 | 07:46:06 |
| capture | 1 | 341 | 31,831 | 5 | 07:46:06 | 07:46:11 |
| synthesize | 1 | 7,486 | 46,375 | 41 | 07:46:11 | 07:46:52 |

- **claude-haiku-5-5**: 11 agent · 49 calls · out 29,288 · in 98 · cache_read 1,416,664 · cache_create 519,172
- **claude-opus-5-5**: 3 agent · 29 calls · out 19,573 · in 58 · cache_read 1,346,230 · cache_create 181,390
- **claude-sonnet-5-5**: 6 agent · 18 calls · out 16,801 · in 36 · cache_read 465,378 · cache_create 260,302

### S4 round 2 (chấm trên M5) — wf_9f4e0ffa-b1e (15 agent, 44,882 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 20 | 8,442 | 40 | 744,193 | 2277 |
| review:bugs | claude-opus-5-5 | 8 | 6,086 | 16 | 307,342 | 59 |
| review:measurement | claude-opus-5-5 | 8 | 5,149 | 16 | 339,338 | 52 |
| synthesize:report | claude-sonnet-5-5 | 2 | 4,658 | 4 | 47,079 | 27 |
| review:conventions | claude-opus-5-5 | 6 | 3,829 | 12 | 204,604 | 38 |
| machine:bash db/db-thu.sh oneinvest_suite_ht31dc | claude-haiku-5-5 | 4 | 3,106 | 8 | 117,229 | 192 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 3,003 | 4 | 36,489 | 127 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,794 | 4 | 36,480 | 270 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 2,482 | 4 | 36,489 | 219 |
| triage | claude-sonnet-5-5 | 2 | 1,640 | 4 | 39,577 | 13 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,196 | 4 | 36,492 | 23 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 860 | 4 | 36,490 | 6 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 756 | 4 | 36,494 | 5 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 554 | 4 | 6,762 | 497 |
| capture:provenance | claude-sonnet-5-5 | 2 | 327 | 4 | 35,046 | 4 |


wall: 3469s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 9 | 23,193 | 1,087,118 | 3425 | 08:02:20 | 08:59:25 |
| review | 3 | 15,064 | 851,284 | 60 | 08:02:20 | 08:03:20 |
| triage | 1 | 1,640 | 39,577 | 13 | 08:59:25 | 08:59:38 |
| capture | 1 | 327 | 35,046 | 4 | 08:59:38 | 08:59:42 |
| synthesize | 1 | 4,658 | 47,079 | 27 | 08:59:42 | 09:00:09 |

- **claude-haiku-5-5**: 9 agent · 38 calls · out 23,193 · in 76 · cache_read 1,087,118 · cache_create 378,779
- **claude-opus-5-5**: 3 agent · 22 calls · out 15,064 · in 44 · cache_read 851,284 · cache_create 163,851
- **claude-sonnet-5-5**: 3 agent · 6 calls · out 6,625 · in 12 · cache_read 121,702 · cache_create 118,478

