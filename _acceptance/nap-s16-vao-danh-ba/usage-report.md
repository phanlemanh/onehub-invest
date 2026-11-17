### S4 round 1 — wf_b8aaeb5a-8ae (25 agent, 70,968 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 15 | 12,507 | 32 | 1,040,357 | 138 |
| synthesize:report | claude-sonnet-5-5 | 2 | 9,106 | 4 | 44,335 | 48 |
| review:conventions | claude-opus-5-5 | 15 | 8,783 | 32 | 985,774 | 103 |
| review:measurement | claude-opus-5-5 | 5 | 5,138 | 12 | 186,274 | 57 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,675 | 6 | 75,637 | 27 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 6 | 3,182 | 12 | 138,670 | 858 |
| triage | claude-sonnet-5-5 | 2 | 3,003 | 4 | 34,209 | 20 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,511 | 4 | 3,300 | 461 |
| machine:node --test --test-concurrency=1 pipelin | claude-haiku-5-5 | 2 | 2,462 | 4 | 32,678 | 23 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,103 | 4 | 32,688 | 8 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 6 | 2,060 | 12 | 137,569 | 856 |
| refute:danh-ba-s16.itest.mjs | claude-sonnet-5-5 | 2 | 1,850 | 4 | 31,488 | 16 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,776 | 4 | 32,692 | 8 |
| refute:sync-cloud.mjs | claude-sonnet-5-5 | 4 | 1,347 | 8 | 96,134 | 11 |
| refute:s16-dung.mjs | claude-sonnet-5-5 | 3 | 1,107 | 6 | 80,745 | 9 |
| refute:s16-danh-muc.test.mjs | claude-sonnet-5-5 | 5 | 1,098 | 10 | 170,466 | 11 |
| machine:node pipeline/scripts/danh-ba-s16-that.m | claude-haiku-5-5 | 2 | 1,093 | 4 | 32,670 | 27 |
| refute:danh-ba-s16.itest.mjs | claude-sonnet-5-5 | 4 | 1,091 | 8 | 103,061 | 11 |
| machine:node --test pipeline/lib/s16-danh-muc.te | claude-haiku-5-5 | 2 | 1,087 | 4 | 32,670 | 6 |
| refute:s16-danh-muc.mjs | claude-sonnet-5-5 | 4 | 1,059 | 8 | 100,117 | 10 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 956 | 4 | 32,690 | 10 |
| machine:node --test pipeline/lib/s16-soat.test.m | claude-haiku-5-5 | 2 | 940 | 4 | 32,666 | 5 |
| refute:danh-ba-s16-that.mjs | claude-sonnet-5-5 | 3 | 897 | 6 | 65,708 | 8 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 800 | 4 | 29,378 | 71 |
| capture:provenance | claude-sonnet-5-5 | 2 | 337 | 4 | 28,140 | 3 |


wall: 2360s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 26,428 | 2,212,405 | 140 | 05:02:02 | 05:04:22 |
| baseline | 1 | 4,675 | 75,637 | 27 | 05:02:02 | 05:02:29 |
| machine | 11 | 18,970 | 537,671 | 2272 | 05:02:02 | 05:39:53 |
| triage | 1 | 3,003 | 34,209 | 20 | 05:39:53 | 05:40:14 |
| refute | 7 | 8,449 | 647,719 | 17 | 05:40:14 | 05:40:31 |
| capture | 1 | 337 | 28,140 | 3 | 05:40:31 | 05:40:34 |
| synthesize | 1 | 9,106 | 44,335 | 48 | 05:40:34 | 05:41:22 |

- **claude-opus-5-5**: 3 agent · 35 calls · out 26,428 · in 76 · cache_read 2,212,405 · cache_create 272,282
- **claude-sonnet-5-5**: 11 agent · 34 calls · out 25,570 · in 68 · cache_read 830,040 · cache_create 447,859
- **claude-haiku-5-5**: 11 agent · 30 calls · out 18,970 · in 60 · cache_read 537,671 · cache_create 431,684

