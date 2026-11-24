### S4 round 1 — wf_80e51fb9-55d (23 agent, 94,172 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 29 | 29,469 | 58 | 1,511,303 | 2667 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 16 | 19,059 | 32 | 707,891 | 1402 |
| synthesize:report | claude-sonnet-5-5 | 2 | 8,210 | 4 | 46,413 | 44 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 7,520 | 6 | 89,363 | 177 |
| review:measurement | claude-opus-5-5 | 6 | 5,182 | 12 | 214,014 | 51 |
| review:conventions | claude-opus-5-5 | 6 | 3,542 | 12 | 217,968 | 35 |
| review:bugs | claude-opus-5-5 | 7 | 3,441 | 14 | 270,495 | 35 |
| triage | claude-sonnet-5-5 | 2 | 2,641 | 4 | 36,403 | 18 |
| refute:enrich-run.ts | claude-sonnet-5-5 | 5 | 1,715 | 10 | 143,644 | 16 |
| refute:enrich-luot-dem-khong-tu-ap.test.ts | claude-sonnet-5-5 | 5 | 1,715 | 10 | 150,216 | 17 |
| machine:bash _acceptance/luot-hang-dem-khong-tu- | claude-haiku-5-5 | 2 | 1,403 | 4 | 36,002 | 70 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,373 | 4 | 36,206 | 31 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 1,064 | 4 | 35,985 | 176 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,007 | 4 | 36,204 | 6 |
| refute:enrich-run.ts | claude-sonnet-5-5 | 3 | 964 | 6 | 70,281 | 10 |
| machine:bash _acceptance/luot-hang-dem-khong-tu- | claude-haiku-5-5 | 2 | 925 | 4 | 36,002 | 67 |
| machine:bash _acceptance/luot-hang-dem-khong-tu- | claude-haiku-5-5 | 2 | 814 | 4 | 36,002 | 64 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 813 | 4 | 3,381 | 550 |
| machine:bash _acceptance/luot-hang-dem-khong-tu- | claude-haiku-5-5 | 2 | 767 | 4 | 36,002 | 63 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 763 | 4 | 36,208 | 6 |
| machine:bash _acceptance/luot-hang-dem-khong-tu- | claude-haiku-5-5 | 2 | 743 | 4 | 36,002 | 64 |
| machine:bash _acceptance/luot-hang-dem-khong-tu- | claude-haiku-5-5 | 2 | 672 | 4 | 36,002 | 62 |
| capture:provenance | claude-sonnet-5-5 | 2 | 370 | 4 | 31,565 | 5 |


wall: 4923s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 13 | 58,872 | 2,583,190 | 4838 | 09:06:34 | 10:27:12 |
| baseline | 1 | 7,520 | 89,363 | 177 | 09:06:34 | 09:09:31 |
| review | 3 | 12,165 | 702,477 | 86 | 09:06:34 | 09:08:00 |
| triage | 1 | 2,641 | 36,403 | 18 | 10:27:12 | 10:27:30 |
| refute | 3 | 4,394 | 364,141 | 18 | 10:27:30 | 10:27:48 |
| capture | 1 | 370 | 31,565 | 5 | 10:27:48 | 10:27:53 |
| synthesize | 1 | 8,210 | 46,413 | 44 | 10:27:53 | 10:28:37 |

- **claude-haiku-5-5**: 13 agent · 67 calls · out 58,872 · in 134 · cache_read 2,583,190 · cache_create 525,894
- **claude-sonnet-5-5**: 7 agent · 22 calls · out 23,135 · in 44 · cache_read 567,885 · cache_create 296,498
- **claude-opus-5-5**: 3 agent · 19 calls · out 12,165 · in 38 · cache_read 702,477 · cache_create 163,626


### S4 vòng 2 — wf_94aea8de-c6d (20 agent, 86,114 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 30 | 29,059 | 60 | 1,606,001 | 2914 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 17 | 17,390 | 34 | 771,047 | 1515 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 7,618 | 6 | 91,168 | 200 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,827 | 4 | 46,401 | 39 |
| review:conventions | claude-opus-5-5 | 10 | 4,531 | 20 | 477,299 | 51 |
| review:bugs | claude-opus-5-5 | 8 | 4,027 | 16 | 358,866 | 44 |
| review:measurement | claude-opus-5-5 | 3 | 2,751 | 6 | 81,982 | 28 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,701 | 4 | 3,381 | 612 |
| triage | claude-sonnet-5-5 | 2 | 2,458 | 4 | 36,037 | 20 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,387 | 4 | 36,872 | 29 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 1,006 | 4 | 36,860 | 175 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 932 | 4 | 36,870 | 7 |
| machine:bash _acceptance/luot-hang-dem-khong-tu- | claude-haiku-5-5 | 2 | 830 | 4 | 36,877 | 74 |
| machine:bash _acceptance/luot-hang-dem-khong-tu- | claude-haiku-5-5 | 2 | 795 | 4 | 36,877 | 74 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 794 | 4 | 36,874 | 5 |
| machine:bash _acceptance/luot-hang-dem-khong-tu- | claude-haiku-5-5 | 2 | 749 | 4 | 36,877 | 74 |
| machine:bash _acceptance/luot-hang-dem-khong-tu- | claude-haiku-5-5 | 2 | 694 | 4 | 36,877 | 76 |
| machine:bash _acceptance/luot-hang-dem-khong-tu- | claude-haiku-5-5 | 2 | 619 | 4 | 36,877 | 84 |
| machine:bash _acceptance/luot-hang-dem-khong-tu- | claude-haiku-5-5 | 2 | 573 | 4 | 36,877 | 73 |
| capture:provenance | claude-sonnet-5-5 | 2 | 373 | 4 | 32,231 | 5 |


wall: 5322s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 7,618 | 91,168 | 200 | 12:20:01 | 12:23:21 |
| machine | 13 | 57,529 | 2,749,167 | 5257 | 12:20:01 | 13:47:38 |
| review | 3 | 11,309 | 918,147 | 73 | 12:20:01 | 12:21:13 |
| triage | 1 | 2,458 | 36,037 | 20 | 13:47:38 | 13:47:58 |
| capture | 1 | 373 | 32,231 | 5 | 13:47:58 | 13:48:04 |
| synthesize | 1 | 6,827 | 46,401 | 39 | 13:48:04 | 13:48:42 |

- **claude-haiku-5-5**: 13 agent · 69 calls · out 57,529 · in 138 · cache_read 2,749,167 · cache_create 535,916
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 17,276 · in 18 · cache_read 205,837 · cache_create 184,122
- **claude-opus-5-5**: 3 agent · 21 calls · out 11,309 · in 42 · cache_read 918,147 · cache_create 184,182


### S4 vòng 3 — wf_db1e6ff5-a2e (20 agent, 90,196 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 32 | 32,658 | 64 | 1,778,295 | 3105 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 21 | 19,376 | 42 | 1,009,366 | 1727 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 7,553 | 6 | 91,142 | 199 |
| synthesize:report | claude-sonnet-5-5 | 2 | 5,514 | 4 | 43,136 | 33 |
| review:bugs | claude-opus-5-5 | 7 | 4,625 | 14 | 319,188 | 49 |
| review:conventions | claude-opus-5-5 | 12 | 4,209 | 24 | 557,973 | 47 |
| review:measurement | claude-opus-5-5 | 5 | 3,866 | 10 | 165,831 | 40 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 3 | 1,667 | 6 | 40,060 | 702 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,455 | 4 | 36,872 | 25 |
| machine:bash _acceptance/luot-hang-dem-khong-tu- | claude-haiku-5-5 | 2 | 1,382 | 4 | 36,877 | 83 |
| machine:bash _acceptance/luot-hang-dem-khong-tu- | claude-haiku-5-5 | 2 | 1,328 | 4 | 36,877 | 79 |
| triage | claude-sonnet-5-5 | 2 | 1,048 | 4 | 34,664 | 9 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 882 | 4 | 36,870 | 6 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 818 | 4 | 36,874 | 7 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 761 | 4 | 36,860 | 192 |
| machine:bash _acceptance/luot-hang-dem-khong-tu- | claude-haiku-5-5 | 2 | 747 | 4 | 36,877 | 77 |
| machine:bash _acceptance/luot-hang-dem-khong-tu- | claude-haiku-5-5 | 2 | 683 | 4 | 36,877 | 77 |
| machine:bash _acceptance/luot-hang-dem-khong-tu- | claude-haiku-5-5 | 2 | 673 | 4 | 36,877 | 78 |
| machine:bash _acceptance/luot-hang-dem-khong-tu- | claude-haiku-5-5 | 2 | 582 | 4 | 36,877 | 76 |
| capture:provenance | claude-sonnet-5-5 | 2 | 369 | 4 | 32,231 | 4 |


wall: 5811s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 7,553 | 91,142 | 199 | 15:51:05 | 15:54:25 |
| machine | 13 | 63,012 | 3,196,459 | 5764 | 15:51:05 | 17:27:10 |
| review | 3 | 12,700 | 1,042,992 | 88 | 15:51:05 | 15:52:33 |
| triage | 1 | 1,048 | 34,664 | 9 | 17:27:10 | 17:27:19 |
| capture | 1 | 369 | 32,231 | 4 | 17:27:19 | 17:27:23 |
| synthesize | 1 | 5,514 | 43,136 | 33 | 17:27:23 | 17:27:56 |

- **claude-haiku-5-5**: 13 agent · 76 calls · out 63,012 · in 152 · cache_read 3,196,459 · cache_create 546,615
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 14,484 · in 18 · cache_read 201,173 · cache_create 179,415
- **claude-opus-5-5**: 3 agent · 24 calls · out 12,700 · in 48 · cache_read 1,042,992 · cache_create 196,945

