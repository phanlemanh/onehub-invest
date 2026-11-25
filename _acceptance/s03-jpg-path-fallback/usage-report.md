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

