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

