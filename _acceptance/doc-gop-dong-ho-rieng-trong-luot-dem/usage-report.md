### S4 round 1 — wf_02e248dc-dd4 (21 agent, 91,732 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 28 | 30,605 | 56 | 1,470,086 | 2774 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 15 | 17,440 | 30 | 649,007 | 1387 |
| synthesize:report | claude-sonnet-5-5 | 2 | 7,463 | 4 | 45,835 | 39 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 6,002 | 6 | 39,328 | 368 |
| review:conventions | claude-opus-5-5 | 10 | 4,773 | 20 | 492,314 | 52 |
| review:bugs | claude-opus-5-5 | 8 | 4,118 | 16 | 369,755 | 43 |
| review:measurement | claude-opus-5-5 | 8 | 3,339 | 16 | 392,885 | 38 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,775 | 4 | 36,456 | 209 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 2,610 | 4 | 36,449 | 94 |
| machine:bash _acceptance/doc-gop-dong-ho-rieng-t | claude-haiku-5-5 | 2 | 1,905 | 4 | 36,474 | 12 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 3 | 1,568 | 6 | 39,484 | 701 |
| triage | claude-sonnet-5-5 | 2 | 1,482 | 4 | 35,780 | 11 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 1,375 | 4 | 36,564 | 148 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,221 | 4 | 36,468 | 46 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,104 | 4 | 36,470 | 7 |
| refute:kiem.sh | claude-sonnet-5-5 | 4 | 1,054 | 8 | 106,047 | 11 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 794 | 4 | 36,466 | 6 |
| refute:kiem.sh | claude-sonnet-5-5 | 3 | 732 | 6 | 67,142 | 8 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 531 | 4 | 36,456 | 217 |
| refute:kiem.sh | claude-sonnet-5-5 | 2 | 522 | 4 | 35,385 | 6 |
| capture:provenance | claude-sonnet-5-5 | 2 | 319 | 4 | 31,804 | 4 |


wall: 5196s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 6,002 | 39,328 | 368 | 13:59:16 | 14:05:24 |
| machine | 11 | 61,928 | 2,450,380 | 5130 | 13:59:16 | 15:24:46 |
| review | 3 | 12,230 | 1,254,954 | 52 | 13:59:16 | 14:00:08 |
| triage | 1 | 1,482 | 35,780 | 11 | 15:24:46 | 15:24:57 |
| refute | 3 | 2,308 | 208,574 | 13 | 15:24:57 | 15:25:10 |
| capture | 1 | 319 | 31,804 | 4 | 15:25:10 | 15:25:13 |
| synthesize | 1 | 7,463 | 45,835 | 39 | 15:25:13 | 15:25:52 |

- **claude-haiku-5-5**: 11 agent · 62 calls · out 61,928 · in 124 · cache_read 2,450,380 · cache_create 467,096
- **claude-sonnet-5-5**: 7 agent · 18 calls · out 17,574 · in 36 · cache_read 361,321 · cache_create 327,971
- **claude-opus-5-5**: 3 agent · 26 calls · out 12,230 · in 52 · cache_read 1,254,954 · cache_create 214,677

### S4 round 2 — wf_ec67e9e9-cd7 (11 agent, 20,937 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 2 | 4,627 | 4 | 46,210 | 28 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 5 | 3,717 | 10 | 113,879 | 720 |
| review:measurement | claude-opus-5-5 | 7 | 2,990 | 14 | 273,090 | 32 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,784 | 4 | 36,485 | 197 |
| machine:bash _acceptance/doc-gop-dong-ho-rieng-t | claude-haiku-5-5 | 2 | 1,960 | 4 | 36,503 | 9 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,088 | 4 | 36,497 | 22 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 985 | 4 | 36,499 | 7 |
| review:conventions | claude-opus-5-5 | 3 | 957 | 6 | 74,626 | 12 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 782 | 4 | 36,495 | 6 |
| review:bugs | claude-opus-5-5 | 3 | 733 | 6 | 78,820 | 10 |
| capture:provenance | claude-sonnet-5-5 | 2 | 314 | 4 | 31,833 | 5 |


wall: 985s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 6 | 11,316 | 296,358 | 952 | 15:29:20 | 15:45:12 |
| review | 3 | 4,680 | 426,536 | 33 | 15:29:20 | 15:29:53 |
| capture | 1 | 314 | 31,833 | 5 | 15:45:12 | 15:45:17 |
| synthesize | 1 | 4,627 | 46,210 | 28 | 15:45:17 | 15:45:45 |

- **claude-sonnet-5-5**: 2 agent · 4 calls · out 4,941 · in 8 · cache_read 78,043 · cache_create 90,722
- **claude-haiku-5-5**: 6 agent · 15 calls · out 11,316 · in 30 · cache_read 296,358 · cache_create 235,363
- **claude-opus-5-5**: 3 agent · 13 calls · out 4,680 · in 26 · cache_read 426,536 · cache_create 137,805

