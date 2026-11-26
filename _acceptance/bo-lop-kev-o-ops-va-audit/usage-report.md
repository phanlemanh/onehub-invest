### S4 vòng 1 — wf_49124164-6d7 (18 agent, 67,387 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 26 | 28,862 | 52 | 1,386,721 | 2491 |
| synthesize:report | claude-sonnet-5-5 | 2 | 5,681 | 4 | 47,616 | 30 |
| review:measurement | claude-opus-5-5 | 5 | 4,600 | 10 | 186,571 | 52 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,151 | 6 | 89,623 | 39 |
| machine:cd app && bash ../db/db-thu.sh oneinvest | claude-haiku-5-5 | 3 | 3,612 | 6 | 81,702 | 52 |
| review:bugs | claude-opus-5-5 | 14 | 3,360 | 30 | 716,956 | 51 |
| review:conventions | claude-opus-5-5 | 8 | 2,978 | 18 | 367,570 | 40 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,811 | 4 | 39,081 | 276 |
| triage | claude-sonnet-5-5 | 2 | 2,429 | 4 | 38,251 | 18 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,667 | 4 | 39,095 | 8 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,491 | 4 | 39,091 | 7 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,181 | 4 | 39,093 | 21 |
| refute:kev2-thu-thap.test.tsx | claude-sonnet-5-5 | 4 | 1,168 | 8 | 115,830 | 12 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 890 | 4 | 39,074 | 6 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 836 | 4 | 39,090 | 126 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 784 | 4 | 3,497 | 531 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 558 | 4 | 39,090 | 189 |
| capture:provenance | claude-sonnet-5-5 | 2 | 328 | 4 | 34,317 | 4 |


wall: 3713s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 10 | 42,692 | 1,745,534 | 3649 | 22:38:59 | 23:39:48 |
| review | 3 | 10,938 | 1,271,097 | 52 | 22:38:59 | 22:39:50 |
| baseline | 1 | 4,151 | 89,623 | 39 | 22:38:59 | 22:39:37 |
| triage | 1 | 2,429 | 38,251 | 18 | 23:39:48 | 23:40:06 |
| refute | 1 | 1,168 | 115,830 | 12 | 23:40:06 | 23:40:18 |
| capture | 1 | 328 | 34,317 | 4 | 23:40:18 | 23:40:22 |
| synthesize | 1 | 5,681 | 47,616 | 30 | 23:40:22 | 23:40:52 |

- **claude-haiku-5-5**: 10 agent · 45 calls · out 42,692 · in 90 · cache_read 1,745,534 · cache_create 436,605
- **claude-sonnet-5-5**: 5 agent · 13 calls · out 13,757 · in 26 · cache_read 325,637 · cache_create 223,274
- **claude-opus-5-5**: 3 agent · 27 calls · out 10,938 · in 58 · cache_read 1,271,097 · cache_create 203,298

