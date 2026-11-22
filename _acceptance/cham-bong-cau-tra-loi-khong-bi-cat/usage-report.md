### S4 round 1 — wf_5c3c8535-39e (23 agent, 57,691 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 2 | 9,074 | 4 | 52,551 | 48 |
| review:measurement | claude-opus-5-5 | 7 | 8,439 | 14 | 331,967 | 91 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 8,132 | 6 | 90,656 | 43 |
| review:bugs | claude-opus-5-5 | 9 | 6,235 | 20 | 463,750 | 74 |
| review:conventions | claude-opus-5-5 | 9 | 5,944 | 18 | 488,166 | 71 |
| triage | claude-sonnet-5-5 | 2 | 3,297 | 4 | 35,942 | 23 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,119 | 4 | 32,164 | 155 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 1,444 | 4 | 35,473 | 101 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 1,402 | 4 | 35,465 | 17 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,328 | 4 | 35,476 | 9 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 1,319 | 4 | 35,473 | 19 |
| machine:bash _acceptance/cham-bong-cau-tra-loi-k | claude-haiku-5-5 | 2 | 951 | 4 | 35,478 | 13 |
| machine:bash _acceptance/cham-bong-cau-tra-loi-k | claude-haiku-5-5 | 2 | 908 | 4 | 35,478 | 11 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 881 | 4 | 35,474 | 7 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 810 | 4 | 35,478 | 8 |
| machine:bash _acceptance/cham-bong-cau-tra-loi-k | claude-haiku-5-5 | 2 | 771 | 4 | 35,476 | 9 |
| machine:bash _acceptance/cham-bong-cau-tra-loi-k | claude-haiku-5-5 | 2 | 769 | 4 | 35,478 | 11 |
| machine:bash _acceptance/cham-bong-cau-tra-loi-k | claude-haiku-5-5 | 2 | 741 | 4 | 35,478 | 8 |
| machine:bash _acceptance/cham-bong-cau-tra-loi-k | claude-haiku-5-5 | 2 | 739 | 4 | 35,478 | 11 |
| machine:bash _acceptance/cham-bong-cau-tra-loi-k | claude-haiku-5-5 | 3 | 738 | 8 | 70,917 | 13 |
| machine:bash _acceptance/cham-bong-cau-tra-loi-k | claude-haiku-5-5 | 2 | 703 | 4 | 35,478 | 11 |
| machine:bash _acceptance/cham-bong-cau-tra-loi-k | claude-haiku-5-5 | 2 | 585 | 4 | 35,478 | 10 |
| capture:provenance | claude-sonnet-5-5 | 2 | 362 | 4 | 30,935 | 3 |


wall: 392s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 8,132 | 90,656 | 43 | 06:28:39 | 06:29:22 |
| review | 3 | 20,618 | 1,283,883 | 93 | 06:28:39 | 06:30:12 |
| machine | 16 | 16,208 | 599,742 | 317 | 06:28:39 | 06:33:56 |
| triage | 1 | 3,297 | 35,942 | 23 | 06:33:56 | 06:34:19 |
| capture | 1 | 362 | 30,935 | 3 | 06:34:19 | 06:34:23 |
| synthesize | 1 | 9,074 | 52,551 | 48 | 06:34:23 | 06:35:11 |

- **claude-sonnet-5-5**: 4 agent · 9 calls · out 20,865 · in 18 · cache_read 210,084 · cache_create 190,178
- **claude-opus-5-5**: 3 agent · 25 calls · out 20,618 · in 52 · cache_read 1,283,883 · cache_create 214,608
- **claude-haiku-5-5**: 16 agent · 33 calls · out 16,208 · in 68 · cache_read 599,742 · cache_create 520,016

