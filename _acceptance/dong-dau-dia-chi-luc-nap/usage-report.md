### S4 round 1 — wf_82bcd920-9b1 (32 agent, 125,003 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 38 | 26,353 | 76 | 3,357,730 | 289 |
| review:measurement | claude-opus-5-5 | 14 | 18,521 | 28 | 1,207,559 | 190 |
| review:conventions | claude-opus-5-5 | 26 | 14,371 | 52 | 2,024,747 | 158 |
| synthesize:report | claude-sonnet-5-5 | 2 | 13,368 | 4 | 51,226 | 74 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 7,253 | 6 | 82,900 | 39 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 9 | 4,286 | 18 | 276,615 | 920 |
| triage | claude-sonnet-5-5 | 2 | 3,963 | 4 | 35,430 | 27 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 11 | 3,243 | 22 | 314,915 | 910 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 3,005 | 4 | 29,393 | 97 |
| judge:E12:operational-feasibility | claude-sonnet-5-5 | 3 | 2,900 | 8 | 79,508 | 22 |
| machine:node --test pipeline/scripts/dong-dau-di | claude-haiku-5-5 | 2 | 2,446 | 4 | 32,714 | 11 |
| judge:E12:spec-alignment | claude-sonnet-5-5 | 2 | 2,173 | 4 | 32,867 | 18 |
| machine:bash db/db-thu.sh oneinvest_suite_tg2 -- | claude-haiku-5-5 | 2 | 2,121 | 4 | 6,600 | 484 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 6 | 2,109 | 12 | 138,031 | 713 |
| refute:transform-zalo.mjs | claude-sonnet-5-5 | 5 | 1,804 | 10 | 139,184 | 16 |
| refute:dong-dau-dia-chi.itest.mjs | claude-sonnet-5-5 | 6 | 1,668 | 12 | 176,181 | 15 |
| judge:E12:domain-correctness | claude-sonnet-5-5 | 2 | 1,565 | 4 | 29,251 | 13 |
| refute:dong-dau-dia-chi.itest.mjs | claude-sonnet-5-5 | 5 | 1,350 | 10 | 149,380 | 12 |
| refute:dong-dau-dia-chi-that.mjs | claude-sonnet-5-5 | 3 | 1,221 | 6 | 67,615 | 10 |
| machine:node pipeline/scripts/dong-dau-dia-chi-t | claude-haiku-5-5 | 2 | 1,153 | 4 | 6,600 | 340 |
| refute:dong-dau-dia-chi.itest.mjs | claude-sonnet-5-5 | 3 | 1,124 | 6 | 73,661 | 9 |
| refute:evals.yaml | claude-sonnet-5-5 | 4 | 1,123 | 8 | 100,204 | 10 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,076 | 4 | 32,705 | 28 |
| machine:node pipeline/scripts/dong-dau-dia-chi-t | claude-haiku-5-5 | 2 | 933 | 4 | 6,600 | 342 |
| machine:node pipeline/scripts/dong-dau-dia-chi-t | claude-haiku-5-5 | 2 | 914 | 4 | 6,600 | 342 |
| refute:dong-dau-dia-chi.itest.mjs | claude-sonnet-5-5 | 3 | 911 | 6 | 65,082 | 9 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 860 | 4 | 32,707 | 5 |
| machine:node pipeline/scripts/dong-dau-dia-chi-t | claude-haiku-5-5 | 2 | 851 | 4 | 6,600 | 343 |
| machine:node pipeline/scripts/dong-dau-dia-chi-t | claude-haiku-5-5 | 2 | 841 | 4 | 6,600 | 344 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 590 | 4 | 32,703 | 3 |
| machine:node pipeline/scripts/quet-doc-stg.mjs | claude-haiku-5-5 | 2 | 585 | 4 | 32,683 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 322 | 4 | 28,150 | 3 |


wall: 2795s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 7,253 | 82,900 | 39 | 15:11:10 | 15:11:50 |
| review | 3 | 59,245 | 6,590,036 | 290 | 15:11:10 | 15:16:00 |
| machine | 15 | 25,013 | 962,066 | 2675 | 15:11:10 | 15:55:46 |
| judge | 3 | 6,638 | 141,626 | 24 | 15:11:10 | 15:11:34 |
| triage | 1 | 3,963 | 35,430 | 27 | 15:55:46 | 15:56:12 |
| refute | 7 | 9,201 | 771,307 | 16 | 15:56:12 | 15:56:28 |
| capture | 1 | 322 | 28,150 | 3 | 15:56:28 | 15:56:31 |
| synthesize | 1 | 13,368 | 51,226 | 74 | 15:56:31 | 15:57:46 |

- **claude-opus-5-5**: 3 agent · 78 calls · out 59,245 · in 156 · cache_read 6,590,036 · cache_create 381,222
- **claude-sonnet-5-5**: 14 agent · 45 calls · out 40,745 · in 92 · cache_read 1,110,639 · cache_create 575,279
- **claude-haiku-5-5**: 15 agent · 50 calls · out 25,013 · in 100 · cache_read 962,066 · cache_create 710,435

### S4 round 2 — wf_28e35fbc-7cc (28 agent, 99,355 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 19 | 15,870 | 38 | 1,329,397 | 170 |
| review:measurement | claude-opus-5-5 | 15 | 13,802 | 30 | 1,037,089 | 146 |
| synthesize:report | claude-sonnet-5-5 | 2 | 13,106 | 4 | 51,284 | 73 |
| review:conventions | claude-opus-5-5 | 16 | 10,881 | 32 | 959,655 | 115 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 7,299 | 6 | 83,410 | 39 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 6 | 4,632 | 12 | 140,237 | 860 |
| triage | claude-sonnet-5-5 | 2 | 3,586 | 4 | 35,769 | 26 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 4 | 3,317 | 8 | 70,064 | 743 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,918 | 4 | 29,625 | 75 |
| machine:bash db/db-thu.sh oneinvest_suite_tg2 -- | claude-haiku-5-5 | 2 | 2,701 | 4 | 6,600 | 434 |
| refute:dia-chi-the-nhom.mjs | claude-sonnet-5-5 | 8 | 2,373 | 16 | 259,127 | 22 |
| machine:node --test pipeline/scripts/dong-dau-di | claude-haiku-5-5 | 2 | 2,365 | 4 | 32,946 | 9 |
| judge:E12:domain-correctness | claude-sonnet-5-5 | 2 | 1,483 | 4 | 29,486 | 12 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,418 | 4 | 32,937 | 19 |
| judge:E12:operational-feasibility | claude-sonnet-5-5 | 2 | 1,416 | 4 | 33,104 | 11 |
| judge:E12:spec-alignment | claude-sonnet-5-5 | 2 | 1,395 | 4 | 33,102 | 11 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 1,344 | 4 | 6,600 | 459 |
| machine:node pipeline/scripts/dong-dau-dia-chi-t | claude-haiku-5-5 | 2 | 1,224 | 4 | 32,940 | 202 |
| machine:node pipeline/scripts/dong-dau-dia-chi-t | claude-haiku-5-5 | 2 | 1,078 | 4 | 32,939 | 201 |
| refute:mau-bai-lac-du-an.mjs | claude-sonnet-5-5 | 3 | 1,013 | 6 | 64,301 | 9 |
| refute:mau-bai-lac-du-an.mjs | claude-sonnet-5-5 | 3 | 965 | 6 | 61,592 | 9 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 908 | 4 | 32,935 | 5 |
| machine:node pipeline/scripts/dong-dau-dia-chi-t | claude-haiku-5-5 | 2 | 899 | 4 | 32,941 | 201 |
| machine:node pipeline/scripts/dong-dau-dia-chi-t | claude-haiku-5-5 | 2 | 852 | 4 | 32,938 | 201 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 773 | 4 | 32,939 | 4 |
| machine:node pipeline/scripts/dong-dau-dia-chi-t | claude-haiku-5-5 | 2 | 723 | 4 | 32,939 | 205 |
| machine:node pipeline/scripts/quet-doc-stg.mjs | claude-haiku-5-5 | 2 | 692 | 4 | 32,915 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 322 | 4 | 28,382 | 4 |


wall: 2292s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 40,553 | 3,326,141 | 171 | 16:52:01 | 16:54:52 |
| baseline | 1 | 7,299 | 83,410 | 39 | 16:52:01 | 16:52:40 |
| machine | 15 | 25,844 | 582,495 | 2167 | 16:52:01 | 17:28:08 |
| judge | 3 | 4,294 | 95,692 | 12 | 16:52:01 | 16:52:13 |
| triage | 1 | 3,586 | 35,769 | 26 | 17:28:08 | 17:28:34 |
| refute | 3 | 4,351 | 385,020 | 23 | 17:28:34 | 17:28:56 |
| capture | 1 | 322 | 28,382 | 4 | 17:28:56 | 17:29:00 |
| synthesize | 1 | 13,106 | 51,284 | 73 | 17:29:00 | 17:30:13 |

- **claude-opus-5-5**: 3 agent · 50 calls · out 40,553 · in 100 · cache_read 3,326,141 · cache_create 296,766
- **claude-sonnet-5-5**: 10 agent · 29 calls · out 32,958 · in 58 · cache_read 679,557 · cache_create 424,419
- **claude-haiku-5-5**: 15 agent · 36 calls · out 25,844 · in 72 · cache_read 582,495 · cache_create 578,827

### S4 round 3 — wf_6ef554fc-7b7 (25 agent, 84,413 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 17 | 19,959 | 34 | 1,434,309 | 209 |
| review:measurement | claude-opus-5-5 | 11 | 10,690 | 22 | 559,857 | 109 |
| synthesize:report | claude-sonnet-5-5 | 2 | 10,409 | 4 | 46,725 | 63 |
| review:conventions | claude-opus-5-5 | 19 | 9,368 | 38 | 1,515,952 | 103 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 6 | 5,245 | 12 | 141,225 | 982 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 7 | 3,877 | 14 | 176,208 | 968 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,612 | 4 | 3,300 | 498 |
| triage | claude-sonnet-5-5 | 2 | 2,429 | 4 | 33,668 | 19 |
| machine:node --test pipeline/scripts/dong-dau-di | claude-haiku-5-5 | 2 | 2,371 | 4 | 33,027 | 9 |
| judge:E12:domain-correctness | claude-sonnet-5-5 | 2 | 1,850 | 4 | 29,567 | 13 |
| machine:bash db/db-thu.sh oneinvest_suite_tg2 -- | claude-haiku-5-5 | 4 | 1,587 | 8 | 74,233 | 619 |
| refute:transform-zalo.mjs | claude-sonnet-5-5 | 4 | 1,534 | 8 | 102,877 | 13 |
| judge:E12:operational-feasibility | claude-sonnet-5-5 | 2 | 1,486 | 4 | 33,185 | 11 |
| judge:E12:spec-alignment | claude-sonnet-5-5 | 3 | 1,456 | 6 | 72,172 | 11 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,340 | 4 | 33,018 | 19 |
| machine:node pipeline/scripts/dong-dau-dia-chi-t | claude-haiku-5-5 | 2 | 1,166 | 4 | 33,019 | 208 |
| machine:node pipeline/scripts/dong-dau-dia-chi-t | claude-haiku-5-5 | 2 | 1,126 | 4 | 33,021 | 211 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,011 | 4 | 33,016 | 5 |
| machine:node pipeline/scripts/dong-dau-dia-chi-t | claude-haiku-5-5 | 2 | 994 | 4 | 33,020 | 220 |
| machine:node pipeline/scripts/dong-dau-dia-chi-t | claude-haiku-5-5 | 2 | 795 | 4 | 33,020 | 210 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 788 | 4 | 33,020 | 5 |
| machine:node pipeline/scripts/dong-dau-dia-chi-t | claude-haiku-5-5 | 2 | 786 | 4 | 33,022 | 215 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 656 | 4 | 33,006 | 70 |
| machine:node pipeline/scripts/quet-doc-stg.mjs | claude-haiku-5-5 | 2 | 554 | 4 | 32,996 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 324 | 4 | 28,463 | 3 |


wall: 2645s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 40,017 | 3,510,118 | 210 | 19:35:06 | 19:38:36 |
| machine | 15 | 24,908 | 758,151 | 2546 | 19:35:06 | 20:17:32 |
| judge | 3 | 4,792 | 134,924 | 13 | 19:35:06 | 19:35:19 |
| triage | 1 | 2,429 | 33,668 | 19 | 20:17:32 | 20:17:51 |
| refute | 1 | 1,534 | 102,877 | 13 | 20:17:51 | 20:18:04 |
| capture | 1 | 324 | 28,463 | 3 | 20:18:04 | 20:18:08 |
| synthesize | 1 | 10,409 | 46,725 | 63 | 20:18:08 | 20:19:10 |

- **claude-opus-5-5**: 3 agent · 47 calls · out 40,017 · in 94 · cache_read 3,510,118 · cache_create 313,542
- **claude-sonnet-5-5**: 7 agent · 17 calls · out 19,488 · in 34 · cache_read 346,657 · cache_create 299,950
- **claude-haiku-5-5**: 15 agent · 41 calls · out 24,908 · in 82 · cache_read 758,151 · cache_create 582,297

