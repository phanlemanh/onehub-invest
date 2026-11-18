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

### S4 round 2 — wf_2c5d475f-23b (15 agent, 52,820 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 12 | 11,823 | 26 | 780,883 | 129 |
| review:conventions | claude-opus-5-5 | 17 | 8,097 | 36 | 1,005,121 | 91 |
| synthesize:report | claude-sonnet-5-5 | 2 | 5,353 | 4 | 40,304 | 29 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 9 | 5,321 | 18 | 245,602 | 1087 |
| review:measurement | claude-opus-5-5 | 6 | 4,997 | 14 | 298,964 | 56 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,677 | 4 | 29,587 | 73 |
| machine:node --test --test-concurrency=1 pipelin | claude-haiku-5-5 | 2 | 2,569 | 4 | 32,893 | 23 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,539 | 4 | 3,300 | 469 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 4 | 2,373 | 8 | 69,916 | 764 |
| triage | claude-sonnet-5-5 | 2 | 1,828 | 4 | 31,895 | 15 |
| machine:node pipeline/scripts/danh-ba-s16-cau-tr | claude-haiku-5-5 | 2 | 1,822 | 4 | 32,887 | 46 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,327 | 4 | 32,899 | 19 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,227 | 4 | 32,897 | 6 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 521 | 4 | 32,901 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 346 | 4 | 28,352 | 3 |


wall: 2472s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 9 | 20,376 | 512,882 | 2424 | 03:28:58 | 04:09:23 |
| review | 3 | 24,917 | 2,084,968 | 130 | 03:28:58 | 03:31:09 |
| triage | 1 | 1,828 | 31,895 | 15 | 04:09:23 | 04:09:37 |
| capture | 1 | 346 | 28,352 | 3 | 04:09:37 | 04:09:41 |
| synthesize | 1 | 5,353 | 40,304 | 29 | 04:09:41 | 04:10:10 |

- **claude-opus-5-5**: 3 agent · 35 calls · out 24,917 · in 76 · cache_read 2,084,968 · cache_create 293,364
- **claude-sonnet-5-5**: 3 agent · 6 calls · out 7,527 · in 12 · cache_read 100,551 · cache_create 123,599
- **claude-haiku-5-5**: 9 agent · 27 calls · out 20,376 · in 54 · cache_read 512,882 · cache_create 375,865

### S4 round 3 — wf_3738235b-6c9 (13 agent, 47,593 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 7 | 8,824 | 16 | 368,109 | 88 |
| review:measurement | claude-opus-5-5 | 5 | 7,997 | 10 | 215,943 | 81 |
| review:bugs | claude-opus-5-5 | 5 | 7,915 | 12 | 234,213 | 79 |
| synthesize:report | claude-sonnet-5-5 | 2 | 5,598 | 4 | 45,561 | 31 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 11 | 3,732 | 22 | 321,259 | 825 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 8 | 3,714 | 16 | 209,781 | 1040 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,731 | 4 | 32,889 | 71 |
| triage | claude-sonnet-5-5 | 2 | 1,916 | 4 | 33,088 | 15 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,608 | 4 | 32,903 | 7 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,300 | 4 | 32,901 | 22 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,248 | 4 | 32,899 | 6 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 673 | 4 | 3,300 | 604 |
| capture:provenance | claude-sonnet-5-5 | 2 | 337 | 4 | 28,354 | 3 |


wall: 2623s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 24,736 | 818,265 | 88 | 06:29:31 | 06:30:59 |
| machine | 7 | 15,006 | 665,932 | 2573 | 06:29:31 | 07:12:24 |
| triage | 1 | 1,916 | 33,088 | 15 | 07:12:24 | 07:12:40 |
| capture | 1 | 337 | 28,354 | 3 | 07:12:40 | 07:12:43 |
| synthesize | 1 | 5,598 | 45,561 | 31 | 07:12:43 | 07:13:14 |

- **claude-opus-5-5**: 3 agent · 17 calls · out 24,736 · in 38 · cache_read 818,265 · cache_create 256,494
- **claude-sonnet-5-5**: 3 agent · 6 calls · out 7,851 · in 12 · cache_read 107,003 · cache_create 130,051
- **claude-haiku-5-5**: 7 agent · 29 calls · out 15,006 · in 58 · cache_read 665,932 · cache_create 313,613

### S4 round 4 — wf_994e2185-26c (12 agent, 45,241 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 6 | 8,793 | 14 | 275,565 | 90 |
| review:conventions | claude-opus-5-5 | 6 | 8,206 | 14 | 308,550 | 83 |
| review:measurement | claude-opus-5-5 | 4 | 6,084 | 10 | 139,629 | 61 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 10 | 5,177 | 20 | 284,282 | 976 |
| synthesize:report | claude-sonnet-5-5 | 2 | 4,247 | 4 | 41,671 | 24 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 6 | 3,155 | 12 | 139,193 | 904 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,702 | 4 | 29,580 | 76 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,145 | 4 | 32,890 | 8 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,834 | 4 | 32,894 | 8 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 4 | 1,331 | 8 | 70,386 | 629 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,232 | 4 | 32,892 | 18 |
| capture:provenance | claude-sonnet-5-5 | 2 | 335 | 4 | 28,345 | 3 |


wall: 2646s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 23,083 | 723,744 | 91 | 09:11:42 | 09:13:13 |
| machine | 7 | 17,576 | 622,117 | 2619 | 09:11:42 | 09:55:21 |
| capture | 1 | 335 | 28,345 | 3 | 09:55:21 | 09:55:24 |
| synthesize | 1 | 4,247 | 41,671 | 24 | 09:55:24 | 09:55:48 |

- **claude-opus-5-5**: 3 agent · 16 calls · out 23,083 · in 38 · cache_read 723,744 · cache_create 253,425
- **claude-haiku-5-5**: 7 agent · 28 calls · out 17,576 · in 56 · cache_read 622,117 · cache_create 317,161
- **claude-sonnet-5-5**: 2 agent · 4 calls · out 4,582 · in 8 · cache_read 70,016 · cache_create 83,928

