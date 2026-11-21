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

### S4 round 2 — wf_d6cd338e-cb8 (15 agent, 37,721 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 12 | 6,025 | 24 | 393,104 | 1379 |
| synthesize:report | claude-sonnet-5-5 | 2 | 5,401 | 4 | 43,271 | 30 |
| review:bugs | claude-opus-5-5 | 5 | 4,058 | 10 | 191,528 | 42 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 7 | 3,998 | 14 | 185,414 | 1010 |
| review:conventions | claude-opus-5-5 | 5 | 3,134 | 10 | 189,992 | 32 |
| review:measurement | claude-opus-5-5 | 4 | 2,796 | 8 | 127,741 | 28 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,469 | 4 | 3,300 | 491 |
| refute:deals-phi-ly-do.mjs | claude-sonnet-5-5 | 4 | 1,848 | 10 | 109,947 | 15 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,687 | 4 | 35,165 | 7 |
| triage | claude-sonnet-5-5 | 2 | 1,472 | 4 | 34,390 | 11 |
| refute:deals-phi-ly-do.mjs | claude-sonnet-5-5 | 2 | 1,348 | 4 | 30,974 | 11 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,314 | 4 | 35,163 | 17 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,046 | 4 | 35,161 | 5 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 711 | 4 | 35,151 | 68 |
| capture:provenance | claude-sonnet-5-5 | 2 | 414 | 4 | 30,610 | 4 |


wall: 3039s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 7 | 17,250 | 722,458 | 2979 | 12:54:11 | 13:43:50 |
| review | 3 | 9,988 | 509,261 | 43 | 12:54:11 | 12:54:54 |
| triage | 1 | 1,472 | 34,390 | 11 | 13:43:50 | 13:44:01 |
| refute | 2 | 3,196 | 140,921 | 15 | 13:44:01 | 13:44:17 |
| capture | 1 | 414 | 30,610 | 4 | 13:44:17 | 13:44:21 |
| synthesize | 1 | 5,401 | 43,271 | 30 | 13:44:21 | 13:44:51 |

- **claude-haiku-5-5**: 7 agent · 29 calls · out 17,250 · in 58 · cache_read 722,458 · cache_create 338,138
- **claude-sonnet-5-5**: 5 agent · 12 calls · out 10,483 · in 26 · cache_read 249,192 · cache_create 228,872
- **claude-opus-5-5**: 3 agent · 14 calls · out 9,988 · in 28 · cache_read 509,261 · cache_create 169,578

### S4 round 3 — wf_8df533b4-26e (14 agent, 28,903 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 16 | 8,209 | 32 | 546,183 | 1869 |
| synthesize:report | claude-sonnet-5-5 | 2 | 3,972 | 4 | 39,332 | 25 |
| machine:cd app && npm test | claude-haiku-5-5 | 6 | 2,929 | 12 | 148,423 | 831 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 6 | 2,831 | 12 | 155,702 | 869 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 6 | 2,518 | 12 | 147,767 | 1061 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,954 | 4 | 35,148 | 8 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,182 | 4 | 36,533 | 21 |
| review:bugs | claude-opus-5-5 | 4 | 1,100 | 10 | 108,690 | 18 |
| review:measurement | claude-opus-5-5 | 3 | 884 | 8 | 70,327 | 11 |
| machine:cd app && node --import tsx ../scripts/d | claude-haiku-5-5 | 2 | 859 | 4 | 35,131 | 82 |
| review:conventions | claude-opus-5-5 | 4 | 854 | 8 | 104,067 | 10 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 609 | 4 | 35,138 | 97 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 595 | 4 | 35,152 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 407 | 4 | 30,597 | 4 |


wall: 3956s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 9 | 21,686 | 1,175,177 | 3928 | 13:46:59 | 14:52:27 |
| review | 3 | 2,838 | 283,084 | 19 | 13:46:59 | 13:47:18 |
| capture | 1 | 407 | 30,597 | 4 | 14:52:27 | 14:52:31 |
| synthesize | 1 | 3,972 | 39,332 | 25 | 14:52:31 | 14:52:55 |

- **claude-haiku-5-5**: 9 agent · 44 calls · out 21,686 · in 88 · cache_read 1,175,177 · cache_create 438,276
- **claude-sonnet-5-5**: 2 agent · 4 calls · out 4,379 · in 8 · cache_read 69,929 · cache_create 83,987
- **claude-opus-5-5**: 3 agent · 11 calls · out 2,838 · in 26 · cache_read 283,084 · cache_create 127,053

