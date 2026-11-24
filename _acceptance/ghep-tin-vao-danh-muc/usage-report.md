### S4 round 2 — wf_ec6f4847-894 (25 agent, 128,519 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 26 | 28,879 | 52 | 1,321,254 | 2489 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 16 | 19,286 | 32 | 699,809 | 1485 |
| review:bugs | claude-opus-5-5 | 27 | 16,274 | 58 | 2,844,329 | 179 |
| review:measurement | claude-opus-5-5 | 17 | 15,329 | 34 | 1,507,801 | 158 |
| synthesize:report | claude-sonnet-5-5 | 2 | 10,511 | 4 | 51,578 | 58 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 8,339 | 6 | 40,748 | 404 |
| review:conventions | claude-opus-5-5 | 17 | 6,994 | 36 | 1,113,695 | 77 |
| triage | claude-sonnet-5-5 | 2 | 4,948 | 4 | 37,738 | 35 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,728 | 4 | 35,840 | 176 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,861 | 4 | 35,850 | 9 |
| judge:E10:spec-alignment | claude-sonnet-5-5 | 3 | 1,441 | 8 | 83,889 | 13 |
| judge:E10:operational-feasibility | claude-sonnet-5-5 | 3 | 1,327 | 8 | 83,893 | 12 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,235 | 4 | 35,852 | 34 |
| judge:E10:domain-correctness | claude-sonnet-5-5 | 2 | 1,157 | 4 | 31,996 | 10 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 3 | 1,054 | 6 | 38,711 | 608 |
| machine:bash _acceptance/ghep-tin-vao-danh-muc/p | claude-haiku-5-5 | 2 | 1,052 | 4 | 35,846 | 9 |
| machine:bash _acceptance/ghep-tin-vao-danh-muc/p | claude-haiku-5-5 | 2 | 955 | 4 | 35,846 | 207 |
| machine:bash _acceptance/ghep-tin-vao-danh-muc/p | claude-haiku-5-5 | 2 | 918 | 4 | 35,848 | 11 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 816 | 4 | 35,854 | 6 |
| machine:bash _acceptance/ghep-tin-vao-danh-muc/p | claude-haiku-5-5 | 2 | 749 | 4 | 6,762 | 556 |
| machine:bash _acceptance/ghep-tin-vao-danh-muc/p | claude-haiku-5-5 | 2 | 706 | 4 | 35,846 | 271 |
| machine:bash _acceptance/ghep-tin-vao-danh-muc/p | claude-haiku-5-5 | 2 | 676 | 4 | 35,843 | 238 |
| machine:bash _acceptance/ghep-tin-vao-danh-muc/p | claude-haiku-5-5 | 2 | 505 | 4 | 6,762 | 548 |
| machine:bash _acceptance/ghep-tin-vao-danh-muc/p | claude-haiku-5-5 | 2 | 443 | 4 | 6,762 | 506 |
| capture:provenance | claude-sonnet-5-5 | 2 | 336 | 4 | 31,199 | 4 |


wall: 4904s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 15 | 61,863 | 2,402,685 | 4808 | 04:51:31 | 06:11:38 |
| baseline | 1 | 8,339 | 40,748 | 404 | 04:51:31 | 04:58:15 |
| judge | 3 | 3,925 | 199,778 | 23 | 04:51:41 | 04:52:04 |
| review | 3 | 38,597 | 5,465,825 | 234 | 04:51:55 | 04:55:49 |
| triage | 1 | 4,948 | 37,738 | 35 | 06:11:38 | 06:12:13 |
| capture | 1 | 336 | 31,199 | 4 | 06:12:13 | 06:12:17 |
| synthesize | 1 | 10,511 | 51,578 | 58 | 06:12:17 | 06:13:15 |

- **claude-haiku-5-5**: 15 agent · 69 calls · out 61,863 · in 138 · cache_read 2,402,685 · cache_create 670,453
- **claude-opus-5-5**: 3 agent · 61 calls · out 38,597 · in 128 · cache_read 5,465,825 · cache_create 395,701
- **claude-sonnet-5-5**: 7 agent · 17 calls · out 28,059 · in 38 · cache_read 361,041 · cache_create 386,695

