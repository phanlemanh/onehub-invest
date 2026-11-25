### S4 round 1 — wf_911f37ef-ada (20 agent, 94,599 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 25 | 27,093 | 50 | 1,288,508 | 2316 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 18 | 20,849 | 36 | 828,626 | 1495 |
| synthesize:report | claude-sonnet-5-5 | 2 | 7,572 | 4 | 50,584 | 40 |
| review:conventions | claude-opus-5-5 | 13 | 6,833 | 26 | 575,815 | 87 |
| review:measurement | claude-opus-5-5 | 6 | 6,705 | 12 | 302,712 | 73 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 6,233 | 6 | 88,793 | 262 |
| triage | claude-sonnet-5-5 | 2 | 3,759 | 4 | 38,678 | 26 |
| review:bugs | claude-opus-5-5 | 4 | 3,446 | 10 | 134,075 | 40 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,781 | 4 | 37,376 | 280 |
| machine:cd collector && rm -rf dist && npm test | claude-haiku-5-5 | 2 | 1,749 | 4 | 37,354 | 119 |
| refute:media-fetch.test.ts | claude-sonnet-5-5 | 4 | 1,459 | 8 | 112,592 | 13 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 898 | 4 | 37,386 | 6 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 836 | 4 | 37,388 | 6 |
| machine:cd collector && rm -rf dist && npm run b | claude-haiku-5-5 | 2 | 829 | 4 | 37,451 | 14 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 760 | 4 | 37,390 | 5 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 732 | 4 | 37,377 | 5 |
| machine:node _acceptance/s03-media-r2-allowlist/ | claude-haiku-5-5 | 2 | 716 | 4 | 37,419 | 6 |
| machine:bash _acceptance/s03-jpg-path-fallback/a | claude-haiku-5-5 | 2 | 474 | 4 | 37,379 | 7 |
| machine:cd collector && npm run check | claude-haiku-5-5 | 2 | 453 | 4 | 37,340 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 422 | 4 | 32,732 | 4 |


wall: 4198s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 12 | 58,170 | 2,490,994 | 4114 | 04:44:46 | 05:53:19 |
| review | 3 | 16,984 | 1,012,602 | 87 | 04:44:46 | 04:46:13 |
| baseline | 1 | 6,233 | 88,793 | 262 | 04:44:46 | 04:49:08 |
| triage | 1 | 3,759 | 38,678 | 26 | 05:53:19 | 05:53:45 |
| refute | 1 | 1,459 | 112,592 | 13 | 05:53:45 | 05:53:58 |
| capture | 1 | 422 | 32,732 | 4 | 05:53:58 | 05:54:02 |
| synthesize | 1 | 7,572 | 50,584 | 40 | 05:54:03 | 05:54:43 |

- **claude-haiku-5-5**: 12 agent · 63 calls · out 58,170 · in 126 · cache_read 2,490,994 · cache_create 467,714
- **claude-sonnet-5-5**: 5 agent · 13 calls · out 19,445 · in 26 · cache_read 323,379 · cache_create 229,475
- **claude-opus-5-5**: 3 agent · 23 calls · out 16,984 · in 48 · cache_read 1,012,602 · cache_create 210,773

### S4 round 2 — wf_79d5e72e-6ac (18 agent, 96,952 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 28 | 30,277 | 56 | 1,499,203 | 2709 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 19 | 20,689 | 38 | 886,063 | 1466 |
| review:measurement | claude-opus-5-5 | 7 | 7,252 | 14 | 312,031 | 71 |
| synthesize:report | claude-sonnet-5-5 | 2 | 7,095 | 4 | 50,093 | 37 |
| review:bugs | claude-opus-5-5 | 10 | 6,387 | 22 | 478,043 | 67 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 5,874 | 6 | 87,521 | 155 |
| review:conventions | claude-opus-5-5 | 9 | 5,792 | 18 | 438,052 | 58 |
| triage | claude-sonnet-5-5 | 2 | 3,960 | 4 | 38,961 | 27 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,782 | 4 | 37,355 | 286 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,049 | 4 | 37,367 | 7 |
| machine:bash _acceptance/s03-jpg-path-fallback/a | claude-haiku-5-5 | 2 | 1,013 | 4 | 37,358 | 10 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 855 | 4 | 37,356 | 6 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 852 | 4 | 37,365 | 5 |
| machine:cd collector && rm -rf dist && npm test | claude-haiku-5-5 | 2 | 783 | 4 | 37,411 | 124 |
| machine:node _acceptance/s03-media-r2-allowlist/ | claude-haiku-5-5 | 2 | 725 | 4 | 37,398 | 8 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 701 | 4 | 37,369 | 6 |
| machine:cd collector && npm run check | claude-haiku-5-5 | 2 | 540 | 4 | 37,319 | 7 |
| capture:provenance | claude-sonnet-5-5 | 2 | 326 | 4 | 32,711 | 4 |


wall: 4552s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 5,874 | 87,521 | 155 | 07:21:56 | 07:24:31 |
| machine | 11 | 60,266 | 2,721,564 | 4485 | 07:21:56 | 08:36:41 |
| review | 3 | 19,431 | 1,228,126 | 72 | 07:21:56 | 07:23:09 |
| triage | 1 | 3,960 | 38,961 | 27 | 08:36:41 | 08:37:08 |
| capture | 1 | 326 | 32,711 | 4 | 08:37:08 | 08:37:12 |
| synthesize | 1 | 7,095 | 50,093 | 37 | 08:37:12 | 08:37:49 |

- **claude-haiku-5-5**: 11 agent · 65 calls · out 60,266 · in 130 · cache_read 2,721,564 · cache_create 439,151
- **claude-opus-5-5**: 3 agent · 26 calls · out 19,431 · in 54 · cache_read 1,228,126 · cache_create 219,139
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 17,255 · in 18 · cache_read 209,286 · cache_create 187,850

