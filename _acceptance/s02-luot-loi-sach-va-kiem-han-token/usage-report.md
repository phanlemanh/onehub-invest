### S4 round 1 — wf_b0158b55-c9d (20 agent, 78,804 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 14 | 16,427 | 28 | 573,490 | 1254 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 12 | 15,461 | 24 | 472,448 | 975 |
| synthesize:report | claude-sonnet-5-5 | 2 | 7,528 | 4 | 46,374 | 40 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 7,162 | 6 | 86,392 | 147 |
| review:bugs | claude-opus-5-5 | 13 | 5,727 | 26 | 624,515 | 70 |
| review:conventions | claude-opus-5-5 | 11 | 5,572 | 22 | 599,149 | 67 |
| review:measurement | claude-opus-5-5 | 5 | 4,654 | 10 | 170,373 | 51 |
| triage | claude-sonnet-5-5 | 2 | 3,378 | 4 | 35,866 | 25 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 3 | 1,643 | 6 | 73,545 | 8 |
| machine:cd collector && npx tsc -p tsconfig.json | claude-haiku-5-5 | 2 | 1,482 | 4 | 34,677 | 10 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,305 | 4 | 34,607 | 7 |
| machine:bash _acceptance/s02-luot-loi-sach-va-ki | claude-haiku-5-5 | 2 | 1,242 | 4 | 34,603 | 6 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 1,222 | 4 | 34,595 | 6 |
| machine:cd collector && npx tsc -p tsconfig.json | claude-haiku-5-5 | 2 | 1,162 | 4 | 34,628 | 6 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,102 | 4 | 34,605 | 6 |
| machine:bash _acceptance/s02-luot-loi-sach-va-ki | claude-haiku-5-5 | 2 | 921 | 4 | 34,605 | 5 |
| machine:cd collector && npm test | claude-haiku-5-5 | 2 | 831 | 4 | 34,557 | 116 |
| refute:vung.sh | claude-sonnet-5-5 | 3 | 785 | 6 | 65,118 | 7 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 765 | 4 | 34,609 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 435 | 4 | 30,054 | 4 |


wall: 2335s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 7,162 | 86,392 | 147 | 20:13:50 | 20:16:17 |
| machine | 12 | 43,563 | 1,430,969 | 2260 | 20:13:50 | 20:51:29 |
| review | 3 | 15,953 | 1,394,037 | 72 | 20:13:50 | 20:15:02 |
| triage | 1 | 3,378 | 35,866 | 25 | 20:51:29 | 20:51:54 |
| refute | 1 | 785 | 65,118 | 7 | 20:51:54 | 20:52:01 |
| capture | 1 | 435 | 30,054 | 4 | 20:52:01 | 20:52:05 |
| synthesize | 1 | 7,528 | 46,374 | 40 | 20:52:05 | 20:52:45 |

- **claude-haiku-5-5**: 12 agent · 47 calls · out 43,563 · in 94 · cache_read 1,430,969 · cache_create 422,499
- **claude-sonnet-5-5**: 5 agent · 12 calls · out 19,288 · in 24 · cache_read 263,804 · cache_create 216,944
- **claude-opus-5-5**: 3 agent · 29 calls · out 15,953 · in 58 · cache_read 1,394,037 · cache_create 201,408

### S4 round 2 — wf_dc24664d-37a (15 agent, 26,577 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 8 | 5,911 | 16 | 230,012 | 957 |
| synthesize:report | claude-sonnet-5-5 | 4 | 5,531 | 8 | 153,446 | 32 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 10 | 3,527 | 20 | 297,812 | 1287 |
| review:conventions | claude-opus-5-5 | 5 | 1,992 | 10 | 160,701 | 22 |
| review:bugs | claude-opus-5-5 | 3 | 1,407 | 6 | 79,229 | 16 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,150 | 4 | 34,575 | 6 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,006 | 4 | 34,642 | 5 |
| machine:bash _acceptance/s02-luot-loi-sach-va-ki | claude-haiku-5-5 | 2 | 958 | 4 | 34,638 | 5 |
| review:measurement | claude-opus-5-5 | 3 | 907 | 6 | 71,061 | 11 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 892 | 4 | 34,631 | 5 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 741 | 4 | 34,571 | 4 |
| refute:vung.sh | claude-sonnet-5-5 | 3 | 734 | 6 | 65,197 | 7 |
| triage | claude-sonnet-5-5 | 2 | 703 | 4 | 32,430 | 6 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 684 | 4 | 34,630 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 434 | 4 | 30,020 | 4 |


wall: 2317s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 8 | 14,869 | 735,511 | 2269 | 20:55:20 | 21:33:09 |
| review | 3 | 4,306 | 310,991 | 22 | 20:55:20 | 20:55:42 |
| triage | 1 | 703 | 32,430 | 6 | 21:33:09 | 21:33:15 |
| refute | 1 | 734 | 65,197 | 7 | 21:33:15 | 21:33:22 |
| capture | 1 | 434 | 30,020 | 4 | 21:33:22 | 21:33:26 |
| synthesize | 1 | 5,531 | 153,446 | 32 | 21:33:26 | 21:33:57 |

- **claude-haiku-5-5**: 8 agent · 30 calls · out 14,869 · in 60 · cache_read 735,511 · cache_create 328,767
- **claude-sonnet-5-5**: 4 agent · 11 calls · out 7,402 · in 22 · cache_read 281,093 · cache_create 162,724
- **claude-opus-5-5**: 3 agent · 11 calls · out 4,306 · in 22 · cache_read 310,991 · cache_create 136,795

