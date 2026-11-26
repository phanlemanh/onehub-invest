### S4 round 1 (M5) — wf_2d21377a-2c8 (30 agent, 79,280 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 2 | 10,302 | 4 | 54,665 | 55 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 9,752 | 6 | 98,950 | 198 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 14 | 7,218 | 28 | 500,767 | 1639 |
| review:measurement | claude-opus-5-5 | 8 | 6,768 | 16 | 407,429 | 82 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 5 | 6,747 | 10 | 161,557 | 306 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 4 | 5,064 | 8 | 118,799 | 128 |
| review:conventions | claude-opus-5-5 | 11 | 4,485 | 22 | 567,320 | 67 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 6 | 4,110 | 12 | 160,649 | 624 |
| review:bugs | claude-opus-5-5 | 8 | 3,163 | 16 | 376,387 | 44 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,743 | 4 | 37,061 | 253 |
| triage | claude-sonnet-5-5 | 2 | 2,543 | 4 | 37,543 | 19 |
| machine:cd collector && rm -rf dist && npm test | claude-haiku-5-5 | 2 | 2,171 | 4 | 37,039 | 87 |
| machine:bash _acceptance/go-kev-khoi-hook-s03/ap | claude-haiku-5-5 | 2 | 1,564 | 4 | 37,069 | 10 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,177 | 4 | 37,073 | 30 |
| refute:kiem.sh | claude-sonnet-5-5 | 3 | 995 | 6 | 74,434 | 10 |
| machine:node --test collector/openclaw/handler.t | claude-haiku-5-5 | 2 | 962 | 4 | 37,041 | 7 |
| machine:bash _acceptance/go-kev-khoi-hook-s03/pr | claude-haiku-5-5 | 2 | 902 | 4 | 37,123 | 8 |
| refute:README.md | claude-sonnet-5-5 | 4 | 848 | 8 | 112,466 | 10 |
| machine:node scripts/kev-nhan/acceptance.mjs han | claude-haiku-5-5 | 2 | 836 | 4 | 37,052 | 6 |
| refute:handler.js | claude-sonnet-5-5 | 3 | 800 | 6 | 72,242 | 10 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 753 | 4 | 37,075 | 6 |
| machine:cd collector && rm -rf dist && npm run b | claude-haiku-5-5 | 2 | 710 | 4 | 37,073 | 8 |
| machine:for m in auth-held held-then-hang reject | claude-haiku-5-5 | 2 | 690 | 4 | 37,118 | 107 |
| machine:node scripts/kev-nhan/acceptance.mjs wat | claude-haiku-5-5 | 2 | 663 | 4 | 37,056 | 6 |
| machine:for m in spool-replay reject-4xx hang-st | claude-haiku-5-5 | 2 | 643 | 4 | 37,119 | 24 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 613 | 4 | 37,071 | 5 |
| machine:node --test scripts/job-exit.test.mjs | claude-haiku-5-5 | 2 | 593 | 4 | 37,041 | 21 |
| machine:node scripts/hook-zalo-spool/acceptance. | claude-haiku-5-5 | 2 | 524 | 4 | 37,082 | 6 |
| refute:handler.js | claude-sonnet-5-5 | 2 | 519 | 4 | 32,884 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 422 | 4 | 32,412 | 4 |


wall: 3081s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 9,752 | 98,950 | 198 | 05:57:55 | 06:01:13 |
| machine | 19 | 38,683 | 1,497,865 | 2992 | 05:57:55 | 06:47:47 |
| review | 3 | 14,416 | 1,351,136 | 85 | 05:57:55 | 05:59:21 |
| triage | 1 | 2,543 | 37,543 | 19 | 06:47:47 | 06:48:06 |
| refute | 4 | 3,162 | 292,026 | 11 | 06:48:06 | 06:48:17 |
| capture | 1 | 422 | 32,412 | 4 | 06:48:17 | 06:48:21 |
| synthesize | 1 | 10,302 | 54,665 | 55 | 06:48:21 | 06:49:16 |

- **claude-sonnet-5-5**: 8 agent · 21 calls · out 26,181 · in 42 · cache_read 515,596 · cache_create 344,601
- **claude-haiku-5-5**: 19 agent · 59 calls · out 38,683 · in 118 · cache_read 1,497,865 · cache_create 734,711
- **claude-opus-5-5**: 3 agent · 27 calls · out 14,416 · in 54 · cache_read 1,351,136 · cache_create 216,999

### S4 round 2 — wf_ca581078-fd9 (26 agent, 94,369 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 26 | 26,738 | 52 | 1,370,381 | 2391 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 10,301 | 6 | 103,841 | 315 |
| synthesize:report | claude-sonnet-5-5 | 2 | 7,285 | 4 | 51,130 | 38 |
| review:bugs | claude-opus-5-5 | 14 | 6,652 | 28 | 852,666 | 84 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 5 | 6,273 | 10 | 163,624 | 226 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 4 | 5,467 | 8 | 123,436 | 131 |
| review:conventions | claude-opus-5-5 | 10 | 5,187 | 20 | 509,744 | 60 |
| review:measurement | claude-opus-5-5 | 8 | 5,046 | 16 | 416,092 | 59 |
| machine:cd collector && rm -rf dist && npm test | claude-haiku-5-5 | 2 | 2,542 | 4 | 39,000 | 86 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,430 | 4 | 3,497 | 534 |
| machine:node --test scripts/job-exit.test.mjs | claude-haiku-5-5 | 2 | 2,267 | 4 | 39,002 | 18 |
| triage | claude-sonnet-5-5 | 2 | 1,944 | 4 | 37,640 | 15 |
| machine:bash _acceptance/go-kev-khoi-hook-s03/ap | claude-haiku-5-5 | 2 | 1,660 | 4 | 39,030 | 9 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,237 | 4 | 39,034 | 27 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,088 | 4 | 39,032 | 7 |
| machine:node --test collector/openclaw/handler.t | claude-haiku-5-5 | 2 | 936 | 4 | 39,002 | 6 |
| machine:bash _acceptance/go-kev-khoi-hook-s03/pr | claude-haiku-5-5 | 2 | 883 | 4 | 39,084 | 8 |
| machine:node scripts/hook-zalo-spool/acceptance. | claude-haiku-5-5 | 2 | 809 | 4 | 39,043 | 6 |
| machine:for m in spool-replay reject-4xx hang-st | claude-haiku-5-5 | 2 | 791 | 4 | 39,080 | 23 |
| machine:node scripts/kev-nhan/acceptance.mjs wat | claude-haiku-5-5 | 2 | 766 | 4 | 39,017 | 5 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 759 | 4 | 39,036 | 6 |
| machine:for m in auth-held held-then-hang reject | claude-haiku-5-5 | 2 | 758 | 4 | 39,079 | 105 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 745 | 4 | 39,022 | 270 |
| machine:cd collector && rm -rf dist && npm run b | claude-haiku-5-5 | 2 | 711 | 4 | 39,034 | 6 |
| machine:node scripts/kev-nhan/acceptance.mjs han | claude-haiku-5-5 | 2 | 675 | 4 | 39,013 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 419 | 4 | 34,265 | 4 |


wall: 3650s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 10,301 | 103,841 | 315 | 20:31:07 | 20:36:22 |
| machine | 19 | 57,535 | 2,246,446 | 3592 | 20:31:07 | 21:30:59 |
| review | 3 | 16,885 | 1,778,502 | 86 | 20:31:15 | 20:32:41 |
| triage | 1 | 1,944 | 37,640 | 15 | 21:30:59 | 21:31:14 |
| capture | 1 | 419 | 34,265 | 4 | 21:31:14 | 21:31:18 |
| synthesize | 1 | 7,285 | 51,130 | 38 | 21:31:18 | 21:31:57 |

- **claude-haiku-5-5**: 19 agent · 67 calls · out 57,535 · in 134 · cache_read 2,246,446 · cache_create 760,667
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 19,949 · in 18 · cache_read 226,876 · cache_create 201,267
- **claude-opus-5-5**: 3 agent · 32 calls · out 16,885 · in 64 · cache_read 1,778,502 · cache_create 240,950

