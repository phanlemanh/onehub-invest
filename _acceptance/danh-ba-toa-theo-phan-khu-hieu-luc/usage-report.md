### S4 wf_fb0b5e5c-cca — wf_fb0b5e5c-cca (19 agent, 47,758 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 6 | 5,816 | 12 | 231,504 | 59 |
| synthesize:report | claude-sonnet-5-5 | 2 | 5,130 | 4 | 40,303 | 28 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 7 | 4,936 | 14 | 175,654 | 869 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,923 | 6 | 77,329 | 32 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 5 | 3,622 | 10 | 105,472 | 717 |
| review:bugs | claude-opus-5-5 | 7 | 3,538 | 14 | 257,748 | 37 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,840 | 4 | 33,084 | 72 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,541 | 4 | 3,300 | 453 |
| review:conventions | claude-opus-5-5 | 5 | 2,303 | 10 | 153,203 | 24 |
| triage | claude-sonnet-5-5 | 2 | 1,900 | 4 | 32,078 | 14 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,768 | 4 | 33,098 | 8 |
| machine:cd app && bash ../db/db-thu.sh oneinvest | claude-haiku-5-5 | 2 | 1,411 | 4 | 33,119 | 19 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,378 | 4 | 33,096 | 16 |
| machine:cd app && node --import tsx --test probe | claude-haiku-5-5 | 2 | 1,199 | 4 | 33,077 | 8 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,146 | 4 | 33,094 | 6 |
| machine:cd app && node --import tsx --test probe | claude-haiku-5-5 | 2 | 1,060 | 4 | 33,074 | 29 |
| machine:cd app && bash ../db/db-thu.sh oneinvest | claude-haiku-5-5 | 2 | 953 | 4 | 33,122 | 18 |
| refute:registry-toa-hieu-luc.test.tsx | claude-sonnet-5-5 | 3 | 936 | 6 | 60,700 | 8 |
| capture:provenance | claude-sonnet-5-5 | 2 | 358 | 4 | 28,556 | 3 |


wall: 2193s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 11,657 | 642,455 | 60 | 21:47:14 | 21:48:14 |
| machine | 11 | 22,854 | 549,190 | 2140 | 21:47:14 | 22:22:54 |
| baseline | 1 | 4,923 | 77,329 | 32 | 21:47:14 | 21:47:45 |
| triage | 1 | 1,900 | 32,078 | 14 | 22:22:54 | 22:23:08 |
| refute | 1 | 936 | 60,700 | 8 | 22:23:08 | 22:23:16 |
| capture | 1 | 358 | 28,556 | 3 | 22:23:16 | 22:23:19 |
| synthesize | 1 | 5,130 | 40,303 | 28 | 22:23:19 | 22:23:47 |

- **claude-opus-5-5**: 3 agent · 18 calls · out 11,657 · in 36 · cache_read 642,455 · cache_create 166,065
- **claude-sonnet-5-5**: 5 agent · 12 calls · out 13,247 · in 24 · cache_read 238,966 · cache_create 199,036
- **claude-haiku-5-5**: 11 agent · 30 calls · out 22,854 · in 60 · cache_read 549,190 · cache_create 434,043

### S4 wf_c4672539-594 — wf_c4672539-594 (15 agent, 43,014 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 17 | 8,093 | 34 | 550,052 | 1798 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 9 | 5,593 | 18 | 246,454 | 1066 |
| synthesize:report | claude-sonnet-5-5 | 5 | 4,865 | 10 | 195,853 | 30 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 10 | 4,198 | 20 | 284,167 | 1252 |
| review:bugs | claude-opus-5-5 | 5 | 3,373 | 10 | 184,717 | 36 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,201 | 6 | 72,270 | 20 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,674 | 4 | 33,061 | 70 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,063 | 4 | 33,071 | 9 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,755 | 4 | 33,075 | 8 |
| review:measurement | claude-opus-5-5 | 2 | 1,743 | 4 | 32,267 | 19 |
| review:conventions | claude-opus-5-5 | 3 | 1,478 | 6 | 64,662 | 17 |
| triage | claude-sonnet-5-5 | 2 | 1,363 | 4 | 31,287 | 11 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,319 | 4 | 33,073 | 19 |
| machine:cd app && bash ../db/db-thu.sh oneinvest | claude-haiku-5-5 | 2 | 940 | 4 | 33,099 | 14 |
| capture:provenance | claude-sonnet-5-5 | 2 | 356 | 4 | 28,533 | 4 |


wall: 4265s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 8 | 26,635 | 1,246,052 | 4220 | 22:25:41 | 23:36:01 |
| review | 3 | 6,594 | 281,646 | 37 | 22:25:41 | 22:26:18 |
| baseline | 1 | 3,201 | 72,270 | 20 | 22:25:41 | 22:26:01 |
| triage | 1 | 1,363 | 31,287 | 11 | 23:36:01 | 23:36:12 |
| capture | 1 | 356 | 28,533 | 4 | 23:36:12 | 23:36:15 |
| synthesize | 1 | 4,865 | 195,853 | 30 | 23:36:15 | 23:36:46 |

- **claude-haiku-5-5**: 8 agent · 46 calls · out 26,635 · in 92 · cache_read 1,246,052 · cache_create 354,462
- **claude-sonnet-5-5**: 4 agent · 12 calls · out 9,785 · in 24 · cache_read 327,943 · cache_create 163,686
- **claude-opus-5-5**: 3 agent · 10 calls · out 6,594 · in 20 · cache_read 281,646 · cache_create 132,713

