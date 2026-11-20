### S4 round 2 — wf_ff30269c-b3e (18 agent, 66,851 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 15 | 16,890 | 30 | 618,578 | 1325 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 11 | 11,074 | 22 | 418,439 | 916 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,758 | 4 | 42,291 | 36 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 6,062 | 6 | 37,147 | 393 |
| review:measurement | claude-opus-5-5 | 4 | 4,091 | 8 | 123,156 | 42 |
| review:bugs | claude-opus-5-5 | 5 | 4,075 | 10 | 158,663 | 41 |
| review:conventions | claude-opus-5-5 | 5 | 2,883 | 10 | 199,193 | 33 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,700 | 4 | 34,265 | 72 |
| triage | claude-sonnet-5-5 | 2 | 2,172 | 4 | 33,459 | 18 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,035 | 4 | 34,275 | 8 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,710 | 4 | 34,279 | 7 |
| machine:bash _acceptance/thuoc-tinh-can-s16-rut- | claude-haiku-5-5 | 2 | 1,394 | 4 | 34,282 | 16 |
| machine:bash _acceptance/thuoc-tinh-can-s16-rut- | claude-haiku-5-5 | 2 | 1,336 | 4 | 34,280 | 11 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,151 | 4 | 34,277 | 18 |
| machine:bash _acceptance/thuoc-tinh-can-s16-rut- | claude-haiku-5-5 | 2 | 755 | 4 | 34,280 | 7 |
| machine:bash _acceptance/thuoc-tinh-can-s16-rut- | claude-haiku-5-5 | 2 | 745 | 4 | 34,280 | 8 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 607 | 4 | 3,300 | 447 |
| capture:provenance | claude-sonnet-5-5 | 2 | 413 | 4 | 29,724 | 4 |


wall: 2851s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 11 | 40,397 | 1,314,535 | 2794 | 18:15:20 | 19:01:53 |
| baseline | 1 | 6,062 | 37,147 | 393 | 18:15:20 | 18:21:53 |
| review | 3 | 11,049 | 481,012 | 44 | 18:15:20 | 18:16:03 |
| triage | 1 | 2,172 | 33,459 | 18 | 19:01:53 | 19:02:11 |
| capture | 1 | 413 | 29,724 | 4 | 19:02:11 | 19:02:15 |
| synthesize | 1 | 6,758 | 42,291 | 36 | 19:02:15 | 19:02:51 |

- **claude-haiku-5-5**: 11 agent · 44 calls · out 40,397 · in 88 · cache_read 1,314,535 · cache_create 418,239
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 15,405 · in 18 · cache_read 142,621 · cache_create 216,259
- **claude-opus-5-5**: 3 agent · 14 calls · out 11,049 · in 28 · cache_read 481,012 · cache_create 180,034

