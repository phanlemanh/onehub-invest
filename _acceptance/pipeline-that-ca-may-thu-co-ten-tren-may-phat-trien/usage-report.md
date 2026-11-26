### S4 round 1 — wf_98312d8a-8d6 (18 agent, 61,255 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 27 | 27,229 | 54 | 1,522,689 | 2519 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,202 | 4 | 47,375 | 34 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,817 | 6 | 87,621 | 42 |
| review:measurement | claude-opus-5-5 | 4 | 3,800 | 8 | 136,379 | 44 |
| review:conventions | claude-opus-5-5 | 4 | 3,416 | 8 | 128,482 | 45 |
| review:bugs | claude-opus-5-5 | 3 | 3,075 | 6 | 85,538 | 39 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 2,959 | 4 | 38,955 | 133 |
| triage | claude-sonnet-5-5 | 2 | 2,816 | 4 | 38,450 | 20 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,206 | 4 | 38,958 | 30 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 850 | 4 | 38,960 | 6 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 786 | 4 | 38,946 | 274 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 766 | 4 | 38,956 | 5 |
| machine:node --test --test-concurrency=1 scripts | claude-haiku-5-5 | 2 | 708 | 4 | 38,935 | 5 |
| machine:bash _acceptance/pipeline-that-ca-may-th | claude-haiku-5-5 | 2 | 614 | 4 | 38,961 | 5 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 604 | 4 | 3,497 | 539 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 2 | 597 | 4 | 38,955 | 219 |
| machine:env -u ONEHUB_HAI_MAY_TEP node --input-t | claude-haiku-5-5 | 2 | 488 | 4 | 39,016 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 322 | 4 | 34,182 | 4 |


wall: 3782s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 10,291 | 350,399 | 47 | 13:51:35 | 13:52:22 |
| baseline | 1 | 4,817 | 87,621 | 42 | 13:51:35 | 13:52:17 |
| machine | 11 | 36,807 | 1,876,828 | 3724 | 13:51:35 | 14:53:39 |
| triage | 1 | 2,816 | 38,450 | 20 | 14:53:39 | 14:53:59 |
| capture | 1 | 322 | 34,182 | 4 | 14:53:59 | 14:54:03 |
| synthesize | 1 | 6,202 | 47,375 | 34 | 14:54:03 | 14:54:37 |

- **claude-haiku-5-5**: 11 agent · 47 calls · out 36,807 · in 94 · cache_read 1,876,828 · cache_create 468,760
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 14,157 · in 18 · cache_read 207,628 · cache_create 184,327
- **claude-opus-5-5**: 3 agent · 11 calls · out 10,291 · in 22 · cache_read 350,399 · cache_create 155,116

