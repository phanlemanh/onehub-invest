### S4 round 1 — wf_71ff40c2-cde (17 agent, 40,686 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,865 | 6 | 77,014 | 42 |
| synthesize:report | claude-sonnet-5-5 | 2 | 4,002 | 4 | 38,445 | 24 |
| machine:cd app && npm test | claude-haiku-5-5 | 5 | 3,784 | 10 | 104,363 | 800 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 9 | 3,499 | 18 | 249,074 | 1060 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,752 | 4 | 33,011 | 97 |
| review:bugs | claude-opus-5-5 | 8 | 2,746 | 16 | 322,066 | 31 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 6 | 2,340 | 12 | 138,944 | 876 |
| review:measurement | claude-opus-5-5 | 5 | 2,221 | 10 | 172,922 | 24 |
| review:conventions | claude-opus-5-5 | 7 | 2,079 | 14 | 273,653 | 24 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 6 | 2,076 | 12 | 142,722 | 783 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 2,066 | 4 | 34,083 | 36 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,058 | 4 | 33,021 | 9 |
| machine:node _acceptance/noi-du-an-s08-khu-do-th | claude-haiku-5-5 | 2 | 1,771 | 4 | 33,014 | 73 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,736 | 4 | 33,025 | 8 |
| machine:for f in app/src/components/ops/quality/ | claude-haiku-5-5 | 2 | 1,195 | 4 | 33,181 | 9 |
| machine:node --test scripts/nhan-du-an-thay-khu- | claude-haiku-5-5 | 2 | 1,139 | 4 | 33,009 | 8 |
| capture:provenance | claude-sonnet-5-5 | 2 | 357 | 4 | 28,480 | 3 |


wall: 2897s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,865 | 77,014 | 42 | 11:10:21 | 11:11:03 |
| machine | 11 | 24,416 | 867,447 | 2869 | 11:10:21 | 11:58:11 |
| review | 3 | 7,046 | 768,641 | 32 | 11:10:21 | 11:10:53 |
| capture | 1 | 357 | 28,480 | 3 | 11:58:11 | 11:58:14 |
| synthesize | 1 | 4,002 | 38,445 | 24 | 11:58:14 | 11:58:38 |

- **claude-sonnet-5-5**: 3 agent · 7 calls · out 9,224 · in 14 · cache_read 143,939 · cache_create 123,304
- **claude-haiku-5-5**: 11 agent · 40 calls · out 24,416 · in 80 · cache_read 867,447 · cache_create 467,870
- **claude-opus-5-5**: 3 agent · 20 calls · out 7,046 · in 40 · cache_read 768,641 · cache_create 158,384

