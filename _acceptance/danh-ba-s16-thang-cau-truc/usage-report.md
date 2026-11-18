### danh-ba-s16-thang-cau-truc S4 r1 — wf_a1427763-706 (24 agent, 103,299 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 30 | 31,487 | 60 | 3,099,580 | 336 |
| review:conventions | claude-opus-5-5 | 22 | 13,140 | 44 | 1,699,499 | 147 |
| review:measurement | claude-opus-5-5 | 8 | 9,842 | 16 | 438,574 | 102 |
| synthesize:report | claude-sonnet-5-5 | 2 | 9,686 | 4 | 44,648 | 49 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 8 | 4,236 | 16 | 209,790 | 1043 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,637 | 6 | 73,286 | 22 |
| triage | claude-sonnet-5-5 | 2 | 3,582 | 4 | 35,910 | 24 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,738 | 4 | 32,984 | 76 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 7 | 2,562 | 14 | 187,629 | 905 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,554 | 4 | 3,300 | 496 |
| machine:node pipeline/scripts/danh-ba-s16-cau-tr | claude-haiku-5-5 | 4 | 2,515 | 8 | 73,921 | 683 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,100 | 4 | 32,994 | 8 |
| machine:node --test --test-concurrency=1 pipelin | claude-haiku-5-5 | 2 | 2,063 | 4 | 32,990 | 18 |
| refute:danh-ba-vat-the.mjs | claude-sonnet-5-5 | 3 | 1,698 | 8 | 66,313 | 15 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,652 | 4 | 32,998 | 7 |
| refute:danh-ba-s16-cau-truc-that.mjs | claude-sonnet-5-5 | 5 | 1,568 | 10 | 138,269 | 15 |
| refute:danh-ba-s16-cau-truc.itest.mjs | claude-sonnet-5-5 | 5 | 1,390 | 10 | 141,703 | 15 |
| refute:danh-ba-s16-cau-truc.itest.mjs | claude-sonnet-5-5 | 3 | 1,349 | 6 | 68,400 | 11 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,232 | 4 | 32,996 | 20 |
| refute:danh-ba-s16-cau-truc.itest.mjs | claude-sonnet-5-5 | 3 | 1,162 | 6 | 68,756 | 10 |
| refute:evals.yaml | claude-sonnet-5-5 | 3 | 1,025 | 6 | 66,282 | 8 |
| refute:s16-dung.mjs | claude-sonnet-5-5 | 3 | 872 | 6 | 61,921 | 7 |
| refute:danh-ba-s16-cau-truc.itest.mjs | claude-sonnet-5-5 | 3 | 869 | 6 | 63,643 | 10 |
| capture:provenance | claude-sonnet-5-5 | 2 | 340 | 4 | 28,449 | 4 |


wall: 2649s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,637 | 73,286 | 22 | 00:35:10 | 00:35:32 |
| review | 3 | 54,469 | 5,237,653 | 338 | 00:35:10 | 00:40:47 |
| machine | 9 | 21,652 | 639,602 | 2556 | 00:35:10 | 01:17:46 |
| triage | 1 | 3,582 | 35,910 | 24 | 01:17:46 | 01:18:09 |
| refute | 8 | 9,933 | 675,287 | 16 | 01:18:09 | 01:18:26 |
| capture | 1 | 340 | 28,449 | 4 | 01:18:26 | 01:18:29 |
| synthesize | 1 | 9,686 | 44,648 | 49 | 01:18:29 | 01:19:18 |

- **claude-opus-5-5**: 3 agent · 60 calls · out 54,469 · in 120 · cache_read 5,237,653 · cache_create 349,023
- **claude-sonnet-5-5**: 12 agent · 37 calls · out 27,178 · in 76 · cache_read 857,580 · cache_create 446,002
- **claude-haiku-5-5**: 9 agent · 31 calls · out 21,652 · in 62 · cache_read 639,602 · cache_create 406,401

