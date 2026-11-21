### S4 round 1 — wf_d08b5cf9-0bf (16 agent, 45,526 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 13 | 6,183 | 26 | 421,619 | 1524 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 7 | 4,640 | 14 | 195,541 | 943 |
| synthesize:report | claude-sonnet-5-5 | 2 | 4,545 | 4 | 42,147 | 27 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 11 | 3,898 | 22 | 348,114 | 1119 |
| review:bugs | claude-opus-5-5 | 5 | 3,715 | 10 | 191,880 | 41 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,352 | 6 | 77,014 | 285 |
| review:conventions | claude-opus-5-5 | 5 | 3,150 | 10 | 191,749 | 38 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,767 | 4 | 35,183 | 164 |
| machine:cd app && npm test | claude-haiku-5-5 | 7 | 2,552 | 14 | 184,587 | 998 |
| review:measurement | claude-opus-5-5 | 3 | 2,507 | 6 | 79,441 | 27 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,175 | 4 | 35,193 | 9 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,801 | 4 | 35,197 | 8 |
| triage | claude-sonnet-5-5 | 2 | 1,769 | 4 | 34,506 | 13 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,318 | 4 | 36,280 | 26 |
| machine:cd app && node --import tsx ../scripts/d | claude-haiku-5-5 | 2 | 828 | 4 | 35,176 | 112 |
| capture:provenance | claude-sonnet-5-5 | 2 | 326 | 4 | 30,642 | 3 |


wall: 3837s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 9 | 26,162 | 1,326,890 | 3793 | 11:47:39 | 12:50:51 |
| review | 3 | 9,372 | 463,070 | 42 | 11:47:39 | 11:48:21 |
| baseline | 1 | 3,352 | 77,014 | 285 | 11:47:39 | 11:52:24 |
| triage | 1 | 1,769 | 34,506 | 13 | 12:50:51 | 12:51:05 |
| capture | 1 | 326 | 30,642 | 3 | 12:51:05 | 12:51:08 |
| synthesize | 1 | 4,545 | 42,147 | 27 | 12:51:08 | 12:51:35 |

- **claude-haiku-5-5**: 9 agent · 48 calls · out 26,162 · in 96 · cache_read 1,326,890 · cache_create 446,029
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 9,992 · in 18 · cache_read 184,309 · cache_create 168,515
- **claude-opus-5-5**: 3 agent · 13 calls · out 9,372 · in 26 · cache_read 463,070 · cache_create 163,565

