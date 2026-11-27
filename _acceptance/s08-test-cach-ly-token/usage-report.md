### S4 round 1 (M5) — wf_e6fe98e9-831 (16 agent, 28,314 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 2 | 3,728 | 4 | 42,198 | 21 |
| review:bugs | claude-opus-5-5 | 5 | 3,237 | 10 | 176,511 | 36 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,056 | 6 | 79,458 | 22 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 2,806 | 4 | 37,070 | 127 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 2,414 | 4 | 37,070 | 257 |
| machine:cd collector && rm -rf dist && HOME=$(mk | claude-haiku-5-5 | 2 | 2,335 | 4 | 37,145 | 122 |
| review:measurement | claude-opus-5-5 | 4 | 2,281 | 8 | 126,320 | 27 |
| review:conventions | claude-opus-5-5 | 4 | 2,103 | 8 | 112,979 | 23 |
| triage | claude-sonnet-5-5 | 2 | 1,221 | 4 | 35,133 | 11 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 973 | 4 | 37,062 | 7 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 935 | 4 | 37,073 | 7 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 865 | 4 | 37,070 | 6 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 761 | 4 | 37,071 | 5 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 673 | 4 | 37,075 | 5 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 502 | 4 | 37,061 | 283 |
| capture:provenance | claude-sonnet-5-5 | 2 | 424 | 4 | 32,412 | 4 |


wall: 733s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,056 | 79,458 | 22 | 08:42:57 | 08:43:19 |
| machine | 9 | 12,264 | 333,697 | 697 | 08:42:57 | 08:54:34 |
| review | 3 | 7,621 | 415,810 | 37 | 08:42:57 | 08:43:35 |
| triage | 1 | 1,221 | 35,133 | 11 | 08:54:34 | 08:54:45 |
| capture | 1 | 424 | 32,412 | 4 | 08:54:45 | 08:54:49 |
| synthesize | 1 | 3,728 | 42,198 | 21 | 08:54:49 | 08:55:10 |

- **claude-sonnet-5-5**: 4 agent · 9 calls · out 8,429 · in 18 · cache_read 189,201 · cache_create 171,073
- **claude-opus-5-5**: 3 agent · 13 calls · out 7,621 · in 26 · cache_read 415,810 · cache_create 138,982
- **claude-haiku-5-5**: 9 agent · 18 calls · out 12,264 · in 36 · cache_read 333,697 · cache_create 310,031

