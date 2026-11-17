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

### S4 round 2 — wf_a3e48528-7cf (18 agent, 69,293 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 18 | 14,276 | 38 | 1,311,372 | 157 |
| review:conventions | claude-opus-5-5 | 24 | 11,275 | 52 | 1,893,374 | 125 |
| synthesize:report | claude-sonnet-5-5 | 2 | 7,192 | 4 | 44,376 | 44 |
| review:measurement | claude-opus-5-5 | 6 | 5,115 | 14 | 323,678 | 53 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,675 | 6 | 75,727 | 27 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 6 | 4,165 | 12 | 137,818 | 921 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 6 | 3,090 | 12 | 137,415 | 883 |
| triage | claude-sonnet-5-5 | 2 | 2,763 | 4 | 32,894 | 20 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,719 | 4 | 32,723 | 78 |
| machine:node --test --test-concurrency=1 pipelin | claude-haiku-5-5 | 2 | 2,500 | 4 | 32,723 | 32 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 3 | 2,313 | 6 | 36,193 | 632 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,067 | 4 | 32,733 | 8 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,699 | 4 | 32,737 | 7 |
| machine:node pipeline/scripts/danh-ba-s16-that.m | claude-haiku-5-5 | 2 | 1,418 | 4 | 32,715 | 39 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,285 | 4 | 32,735 | 21 |
| machine:node --test pipeline/lib/s16-soat.test.m | claude-haiku-5-5 | 2 | 1,235 | 4 | 32,711 | 7 |
| machine:node --test pipeline/lib/s16-danh-muc.te | claude-haiku-5-5 | 2 | 1,173 | 4 | 32,715 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 333 | 4 | 28,185 | 3 |


wall: 2619s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,675 | 75,727 | 27 | 06:21:59 | 06:22:27 |
| review | 3 | 30,666 | 3,528,424 | 158 | 06:21:59 | 06:24:37 |
| machine | 11 | 23,664 | 573,218 | 2551 | 06:21:59 | 07:04:30 |
| triage | 1 | 2,763 | 32,894 | 20 | 07:04:30 | 07:04:51 |
| capture | 1 | 333 | 28,185 | 3 | 07:04:51 | 07:04:54 |
| synthesize | 1 | 7,192 | 44,376 | 44 | 07:04:54 | 07:05:38 |

- **claude-opus-5-5**: 3 agent · 48 calls · out 30,666 · in 104 · cache_read 3,528,424 · cache_create 311,996
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 14,963 · in 18 · cache_read 181,182 · cache_create 170,716
- **claude-haiku-5-5**: 11 agent · 31 calls · out 23,664 · in 62 · cache_read 573,218 · cache_create 430,284

### S4 round 3 — wf_7163db03-e95 (18 agent, 78,889 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 40 | 25,495 | 84 | 4,608,826 | 334 |
| review:measurement | claude-opus-5-5 | 9 | 11,563 | 20 | 622,885 | 120 |
| review:conventions | claude-opus-5-5 | 17 | 9,278 | 36 | 1,210,615 | 102 |
| synthesize:report | claude-sonnet-5-5 | 3 | 7,102 | 6 | 100,871 | 42 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 7 | 4,705 | 14 | 174,025 | 964 |
| triage | claude-sonnet-5-5 | 2 | 3,233 | 4 | 34,125 | 24 |
| machine:node --test --test-concurrency=1 pipelin | claude-haiku-5-5 | 2 | 2,515 | 4 | 32,912 | 31 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,043 | 4 | 32,922 | 9 |
| machine:node pipeline/scripts/danh-ba-s16-that.m | claude-haiku-5-5 | 2 | 1,858 | 4 | 32,904 | 42 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 4 | 1,819 | 8 | 70,048 | 792 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,701 | 4 | 32,926 | 8 |
| machine:node --test pipeline/lib/s16-soat.test.m | claude-haiku-5-5 | 2 | 1,495 | 4 | 32,900 | 7 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,418 | 4 | 32,924 | 21 |
| machine:node --test pipeline/lib/s16-danh-muc.te | claude-haiku-5-5 | 2 | 1,268 | 4 | 32,904 | 7 |
| refute:s16-soat.test.mjs | claude-sonnet-5-5 | 2 | 1,178 | 4 | 28,698 | 10 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 3 | 1,175 | 6 | 36,339 | 662 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 705 | 4 | 29,612 | 84 |
| capture:provenance | claude-sonnet-5-5 | 2 | 338 | 4 | 28,374 | 4 |


wall: 2620s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 11 | 20,702 | 540,416 | 2540 | 08:59:35 | 09:41:55 |
| review | 3 | 46,336 | 6,442,326 | 335 | 08:59:35 | 09:05:10 |
| triage | 1 | 3,233 | 34,125 | 24 | 09:41:55 | 09:42:19 |
| refute | 1 | 1,178 | 28,698 | 10 | 09:42:19 | 09:42:29 |
| capture | 1 | 338 | 28,374 | 4 | 09:42:29 | 09:42:33 |
| synthesize | 1 | 7,102 | 100,871 | 42 | 09:42:33 | 09:43:15 |

- **claude-opus-5-5**: 3 agent · 66 calls · out 46,336 · in 140 · cache_read 6,442,326 · cache_create 368,749
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 11,851 · in 18 · cache_read 192,068 · cache_create 178,776
- **claude-haiku-5-5**: 11 agent · 30 calls · out 20,702 · in 60 · cache_read 540,416 · cache_create 435,169

### S4 round 4 — wf_6f773445-8a4 (17 agent, 98,727 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 30 | 31,702 | 62 | 3,385,771 | 331 |
| review:conventions | claude-opus-5-5 | 31 | 17,522 | 66 | 2,976,805 | 184 |
| review:measurement | claude-opus-5-5 | 18 | 15,024 | 38 | 1,577,167 | 156 |
| synthesize:report | claude-sonnet-5-5 | 4 | 7,674 | 8 | 164,148 | 42 |
| triage | claude-sonnet-5-5 | 2 | 4,506 | 4 | 35,768 | 31 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 5 | 3,274 | 10 | 104,144 | 772 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,830 | 4 | 32,939 | 72 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 7 | 2,618 | 14 | 173,753 | 896 |
| machine:node --test --test-concurrency=1 pipelin | claude-haiku-5-5 | 2 | 2,545 | 4 | 32,939 | 23 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,516 | 4 | 3,300 | 450 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,108 | 4 | 32,949 | 10 |
| machine:node pipeline/scripts/danh-ba-s16-that.m | claude-haiku-5-5 | 2 | 1,818 | 4 | 32,931 | 31 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,259 | 4 | 32,951 | 17 |
| machine:node --test pipeline/lib/s16-danh-muc.te | claude-haiku-5-5 | 2 | 1,177 | 4 | 32,931 | 6 |
| machine:node --test pipeline/lib/s16-soat.test.m | claude-haiku-5-5 | 2 | 1,170 | 4 | 32,927 | 6 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 650 | 4 | 32,953 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 334 | 4 | 28,401 | 3 |


wall: 2298s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 64,248 | 7,939,743 | 332 | 10:29:16 | 10:34:48 |
| machine | 11 | 21,965 | 544,717 | 2221 | 10:29:16 | 11:06:18 |
| triage | 1 | 4,506 | 35,768 | 31 | 11:06:18 | 11:06:49 |
| capture | 1 | 334 | 28,401 | 3 | 11:06:49 | 11:06:52 |
| synthesize | 1 | 7,674 | 164,148 | 42 | 11:06:52 | 11:07:35 |

- **claude-opus-5-5**: 3 agent · 79 calls · out 64,248 · in 166 · cache_read 7,939,743 · cache_create 426,952
- **claude-sonnet-5-5**: 3 agent · 8 calls · out 12,514 · in 16 · cache_read 228,317 · cache_create 137,381
- **claude-haiku-5-5**: 11 agent · 30 calls · out 21,965 · in 60 · cache_read 544,717 · cache_create 432,895

### S4 round 5 — wf_8b16f27e-b26 (17 agent, 43,502 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 10 | 5,715 | 20 | 286,580 | 1203 |
| review:bugs | claude-opus-5-5 | 10 | 5,242 | 22 | 476,930 | 57 |
| synthesize:report | claude-sonnet-5-5 | 2 | 4,223 | 4 | 39,720 | 26 |
| review:conventions | claude-opus-5-5 | 6 | 3,785 | 14 | 215,177 | 39 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 11 | 3,748 | 22 | 314,591 | 1287 |
| machine:node pipeline/scripts/danh-ba-s16-that.m | claude-haiku-5-5 | 3 | 3,201 | 8 | 66,989 | 42 |
| review:measurement | claude-opus-5-5 | 7 | 2,996 | 16 | 272,860 | 34 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,749 | 4 | 29,580 | 81 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,554 | 4 | 3,300 | 531 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,061 | 4 | 32,890 | 8 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,692 | 4 | 32,894 | 8 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,327 | 4 | 32,892 | 19 |
| machine:node --test pipeline/lib/s16-soat.test.m | claude-haiku-5-5 | 2 | 1,263 | 4 | 32,868 | 8 |
| machine:node --test pipeline/lib/s16-danh-muc.te | claude-haiku-5-5 | 2 | 995 | 4 | 32,872 | 5 |
| machine:node --test --test-concurrency=1 pipelin | claude-haiku-5-5 | 2 | 907 | 4 | 32,880 | 27 |
| triage | claude-sonnet-5-5 | 2 | 710 | 4 | 30,621 | 7 |
| capture:provenance | claude-sonnet-5-5 | 2 | 334 | 4 | 28,342 | 3 |


wall: 3173s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 11 | 26,212 | 898,336 | 3137 | 12:47:19 | 13:39:36 |
| review | 3 | 12,023 | 964,967 | 58 | 12:47:19 | 12:48:18 |
| triage | 1 | 710 | 30,621 | 7 | 13:39:36 | 13:39:43 |
| capture | 1 | 334 | 28,342 | 3 | 13:39:43 | 13:39:46 |
| synthesize | 1 | 4,223 | 39,720 | 26 | 13:39:47 | 13:40:13 |

- **claude-haiku-5-5**: 11 agent · 40 calls · out 26,212 · in 82 · cache_read 898,336 · cache_create 441,637
- **claude-opus-5-5**: 3 agent · 23 calls · out 12,023 · in 52 · cache_read 964,967 · cache_create 195,474
- **claude-sonnet-5-5**: 3 agent · 6 calls · out 5,267 · in 12 · cache_read 98,683 · cache_create 122,229

