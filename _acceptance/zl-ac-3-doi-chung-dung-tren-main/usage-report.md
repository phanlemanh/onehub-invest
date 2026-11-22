### S4 round 1 — wf_1f69f18a-2d2 (18 agent, 152,061 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 473 | 112,328 | 946 | 58,391,702 | 1600 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,027 | 4 | 43,791 | 34 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,803 | 6 | 81,034 | 52 |
| review:bugs | claude-opus-5-5 | 5 | 4,685 | 10 | 163,761 | 49 |
| review:measurement | claude-opus-5-5 | 5 | 4,368 | 10 | 164,880 | 44 |
| review:conventions | claude-opus-5-5 | 6 | 4,069 | 12 | 224,399 | 42 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 9 | 3,816 | 18 | 264,595 | 1201 |
| triage | claude-sonnet-5-5 | 2 | 2,474 | 4 | 35,030 | 18 |
| machine:node _acceptance/zl-ac-3-doi-chung-dung- | claude-haiku-5-5 | 2 | 1,608 | 4 | 35,282 | 170 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,183 | 4 | 35,284 | 15 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,179 | 4 | 35,282 | 8 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 985 | 4 | 31,972 | 165 |
| machine:node --test scripts/zalo-import-job-lan. | claude-haiku-5-5 | 2 | 945 | 4 | 35,259 | 33 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 941 | 4 | 35,286 | 8 |
| machine:bash _acceptance/zl-ac-3-doi-chung-dung- | claude-haiku-5-5 | 2 | 857 | 4 | 35,285 | 91 |
| machine:node _acceptance/zl-ac-3-doi-chung-dung- | claude-haiku-5-5 | 2 | 767 | 4 | 35,283 | 5 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 699 | 4 | 3,300 | 519 |
| capture:provenance | claude-sonnet-5-5 | 2 | 327 | 4 | 30,726 | 3 |


wall: 3571s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 11 | 125,308 | 58,938,530 | 3516 | 02:53:12 | 03:51:48 |
| baseline | 1 | 4,803 | 81,034 | 52 | 02:53:12 | 02:54:04 |
| review | 3 | 13,122 | 553,040 | 50 | 02:53:12 | 02:54:02 |
| triage | 1 | 2,474 | 35,030 | 18 | 03:51:48 | 03:52:06 |
| capture | 1 | 327 | 30,726 | 3 | 03:52:06 | 03:52:09 |
| synthesize | 1 | 6,027 | 43,791 | 34 | 03:52:09 | 03:52:43 |

- **claude-haiku-5-5**: 11 agent · 500 calls · out 125,308 · in 1,000 · cache_read 58,938,530 · cache_create 643,015
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 13,631 · in 18 · cache_read 190,581 · cache_create 173,335
- **claude-opus-5-5**: 3 agent · 16 calls · out 13,122 · in 32 · cache_read 553,040 · cache_create 157,857

