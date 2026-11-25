### S4 round 1 — wf_6eb1f75d-502 (18 agent, 86,419 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 26 | 28,376 | 52 | 1,333,620 | 2488 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 16 | 14,635 | 32 | 697,400 | 1328 |
| review:bugs | claude-opus-5-5 | 12 | 9,498 | 26 | 733,225 | 96 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,082 | 4 | 46,901 | 34 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 6,041 | 6 | 90,119 | 325 |
| review:measurement | claude-opus-5-5 | 5 | 5,767 | 10 | 176,963 | 59 |
| review:conventions | claude-opus-5-5 | 5 | 3,783 | 10 | 192,886 | 37 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,477 | 4 | 3,381 | 548 |
| triage | claude-sonnet-5-5 | 2 | 1,984 | 4 | 36,250 | 15 |
| machine:bash _acceptance/tran-tong-luot-dem-va-t | claude-haiku-5-5 | 2 | 1,681 | 4 | 36,553 | 9 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,234 | 4 | 36,551 | 22 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 889 | 4 | 36,532 | 64 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 821 | 4 | 36,539 | 175 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 781 | 4 | 36,553 | 6 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 748 | 4 | 36,549 | 5 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 704 | 4 | 36,647 | 121 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 604 | 4 | 36,539 | 29 |
| capture:provenance | claude-sonnet-5-5 | 2 | 314 | 4 | 31,887 | 4 |


wall: 4624s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 6,041 | 90,119 | 325 | 03:28:29 | 03:33:54 |
| machine | 11 | 52,950 | 2,326,864 | 4571 | 03:28:29 | 04:44:40 |
| review | 3 | 19,048 | 1,103,074 | 96 | 03:28:29 | 03:30:05 |
| triage | 1 | 1,984 | 36,250 | 15 | 04:44:40 | 04:44:55 |
| capture | 1 | 314 | 31,887 | 4 | 04:44:55 | 04:44:59 |
| synthesize | 1 | 6,082 | 46,901 | 34 | 04:44:59 | 04:45:33 |

- **claude-haiku-5-5**: 11 agent · 60 calls · out 52,950 · in 120 · cache_read 2,326,864 · cache_create 463,212
- **claude-opus-5-5**: 3 agent · 22 calls · out 19,048 · in 46 · cache_read 1,103,074 · cache_create 221,470
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 14,421 · in 18 · cache_read 205,157 · cache_create 178,709

