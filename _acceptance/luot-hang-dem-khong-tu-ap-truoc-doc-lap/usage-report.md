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

