### S4 round 1 — wf_6038ce55-6e4 (23 agent, 74,562 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 17 | 11,906 | 34 | 1,015,930 | 126 |
| review:measurement | claude-opus-5-5 | 9 | 11,748 | 18 | 439,466 | 124 |
| review:bugs | claude-opus-5-5 | 7 | 10,139 | 14 | 302,365 | 113 |
| synthesize:report | claude-sonnet-5-5 | 2 | 7,626 | 4 | 41,238 | 45 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 6,866 | 6 | 73,835 | 113 |
| machine:node scripts/suite-neu-doi.mjs pipeline | claude-haiku-5-5 | 11 | 4,570 | 22 | 278,593 | 1207 |
| triage | claude-sonnet-5-5 | 2 | 3,281 | 4 | 29,992 | 24 |
| refute:suite-neu-doi.mjs | claude-sonnet-5-5 | 5 | 2,115 | 10 | 121,217 | 25 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,094 | 4 | 28,470 | 9 |
| machine:node --test scripts/*.test.mjs | claude-haiku-5-5 | 2 | 1,982 | 4 | 28,434 | 249 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 6 | 1,912 | 12 | 122,322 | 821 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,911 | 4 | 28,474 | 8 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,136 | 4 | 28,472 | 25 |
| refute:suite-neu-doi.test.mjs | claude-sonnet-5-5 | 3 | 892 | 6 | 58,531 | 14 |
| machine:node --test scripts/dung-worktree-cham.t | claude-haiku-5-5 | 2 | 855 | 4 | 28,446 | 9 |
| machine:node --test --test-name-pattern=S4V-AC-1 | claude-haiku-5-5 | 2 | 839 | 4 | 28,465 | 9 |
| machine:node --test --test-name-pattern=S4V-AC-6 | claude-haiku-5-5 | 2 | 789 | 4 | 28,504 | 6 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 746 | 4 | 25,271 | 39 |
| machine:node --test --test-name-pattern=S4V-AC-5 | claude-haiku-5-5 | 2 | 713 | 4 | 28,465 | 6 |
| machine:node --test --test-name-pattern=S4V-AC-4 | claude-haiku-5-5 | 2 | 687 | 4 | 28,465 | 9 |
| machine:node --test --test-name-pattern=S4V-AC-2 | claude-haiku-5-5 | 2 | 676 | 4 | 28,465 | 11 |
| machine:node --test --test-name-pattern=S4V-AC-3 | claude-haiku-5-5 | 2 | 660 | 4 | 28,465 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 419 | 4 | 24,030 | 9 |


wall: 2212s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 6,866 | 73,835 | 113 | 18:05:28 | 18:07:21 |
| machine | 14 | 19,570 | 739,311 | 2108 | 18:05:28 | 18:40:36 |
| review | 3 | 33,793 | 1,757,761 | 126 | 18:05:28 | 18:07:34 |
| triage | 1 | 3,281 | 29,992 | 24 | 18:40:36 | 18:41:00 |
| refute | 2 | 3,007 | 179,748 | 25 | 18:41:00 | 18:41:25 |
| capture | 1 | 419 | 24,030 | 9 | 18:41:25 | 18:41:34 |
| synthesize | 1 | 7,626 | 41,238 | 45 | 18:41:34 | 18:42:19 |

- **claude-opus-5-5**: 3 agent · 33 calls · out 33,793 · in 66 · cache_read 1,757,761 · cache_create 212,683
- **claude-sonnet-5-5**: 6 agent · 17 calls · out 21,199 · in 34 · cache_read 348,843 · cache_create 222,303
- **claude-haiku-5-5**: 14 agent · 41 calls · out 19,570 · in 82 · cache_read 739,311 · cache_create 427,371

