### S4 round 1 (M5) — wf_efa7fa1c-45a (18 agent, 35,495 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 10 | 10,611 | 20 | 387,080 | 680 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 5,449 | 6 | 86,519 | 110 |
| synthesize:report | claude-sonnet-5-5 | 2 | 3,485 | 4 | 41,618 | 23 |
| review:bugs | claude-opus-5-5 | 7 | 2,644 | 14 | 270,707 | 98 |
| review:conventions | claude-opus-5-5 | 5 | 2,021 | 10 | 164,860 | 28 |
| review:measurement | claude-opus-5-5 | 3 | 1,441 | 6 | 78,014 | 21 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,227 | 4 | 37,057 | 27 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,121 | 4 | 37,055 | 6 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 1,091 | 4 | 37,054 | 7 |
| machine:F=app/tests/api-markets-khong-s02.test.t | claude-haiku-5-5 | 2 | 914 | 4 | 37,110 | 6 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 849 | 4 | 37,045 | 263 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 822 | 4 | 37,054 | 124 |
| machine:set -o pipefail; cd app && bash ../db/db | claude-haiku-5-5 | 2 | 813 | 4 | 37,134 | 36 |
| machine:set -o pipefail; cd app && bash ../db/db | claude-haiku-5-5 | 2 | 791 | 4 | 37,134 | 37 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 742 | 4 | 37,059 | 5 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 588 | 4 | 37,054 | 209 |
| machine:git diff --exit-code 04b9ddc3b -- app/sr | claude-haiku-5-5 | 2 | 555 | 4 | 37,051 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 331 | 4 | 32,396 | 4 |


wall: 1348s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 5,449 | 86,519 | 110 | 06:15:57 | 06:17:47 |
| machine | 12 | 20,124 | 794,887 | 1321 | 06:15:57 | 06:37:58 |
| review | 3 | 6,106 | 513,581 | 101 | 06:15:57 | 06:17:38 |
| capture | 1 | 331 | 32,396 | 4 | 06:37:58 | 06:38:02 |
| synthesize | 1 | 3,485 | 41,618 | 23 | 06:38:02 | 06:38:25 |

- **claude-haiku-5-5**: 12 agent · 32 calls · out 20,124 · in 64 · cache_read 794,887 · cache_create 431,906
- **claude-sonnet-5-5**: 3 agent · 7 calls · out 9,265 · in 14 · cache_read 160,533 · cache_create 135,386
- **claude-opus-5-5**: 3 agent · 15 calls · out 6,106 · in 30 · cache_read 513,581 · cache_create 137,196

