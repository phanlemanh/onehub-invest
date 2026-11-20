### S4 round 1 — wf_4e945892-130 (24 agent, 63,188 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 19 | 8,541 | 38 | 642,584 | 1824 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 8,500 | 6 | 88,663 | 47 |
| synthesize:report | claude-sonnet-5-5 | 2 | 7,443 | 4 | 46,102 | 43 |
| review:conventions | claude-opus-5-5 | 10 | 6,222 | 22 | 617,833 | 69 |
| review:bugs | claude-opus-5-5 | 4 | 4,532 | 8 | 122,718 | 47 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 4 | 2,998 | 8 | 72,115 | 658 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,920 | 4 | 30,530 | 101 |
| review:measurement | claude-opus-5-5 | 4 | 2,814 | 8 | 123,133 | 29 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 9 | 2,600 | 18 | 250,702 | 717 |
| triage | claude-sonnet-5-5 | 2 | 2,423 | 4 | 33,973 | 20 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,129 | 4 | 33,840 | 9 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,633 | 4 | 33,844 | 8 |
| machine:node pipeline/scripts/phan-khu-s16-noi-t | claude-haiku-5-5 | 2 | 1,602 | 4 | 33,826 | 82 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,350 | 4 | 33,842 | 26 |
| machine:node --test --test-concurrency=1 --test- | claude-haiku-5-5 | 2 | 1,190 | 4 | 33,849 | 16 |
| machine:cd app && bash ../db/db-thu.sh oneinvest | claude-haiku-5-5 | 2 | 964 | 4 | 33,861 | 28 |
| machine:node --test --test-concurrency=1 --test- | claude-haiku-5-5 | 2 | 790 | 4 | 33,849 | 15 |
| machine:node --test --test-concurrency=1 --test- | claude-haiku-5-5 | 2 | 769 | 4 | 33,849 | 15 |
| machine:node --test --test-concurrency=1 --test- | claude-haiku-5-5 | 2 | 706 | 4 | 33,849 | 14 |
| machine:node --test --test-concurrency=1 --test- | claude-haiku-5-5 | 2 | 682 | 4 | 33,849 | 14 |
| machine:node --test --test-concurrency=1 --test- | claude-haiku-5-5 | 2 | 672 | 4 | 33,849 | 14 |
| machine:node --test --test-concurrency=1 --test- | claude-haiku-5-5 | 2 | 651 | 4 | 33,849 | 14 |
| machine:node --test --test-concurrency=1 --test- | claude-haiku-5-5 | 2 | 640 | 4 | 33,849 | 14 |
| capture:provenance | claude-sonnet-5-5 | 2 | 417 | 4 | 29,293 | 5 |


wall: 3411s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 8,500 | 88,663 | 47 | 09:50:34 | 09:51:21 |
| machine | 17 | 30,837 | 1,435,936 | 3344 | 09:50:34 | 10:46:18 |
| review | 3 | 13,568 | 863,684 | 69 | 09:50:34 | 09:51:43 |
| triage | 1 | 2,423 | 33,973 | 20 | 10:46:18 | 10:46:38 |
| capture | 1 | 417 | 29,293 | 5 | 10:46:38 | 10:46:43 |
| synthesize | 1 | 7,443 | 46,102 | 43 | 10:46:43 | 10:47:25 |

- **claude-haiku-5-5**: 17 agent · 60 calls · out 30,837 · in 120 · cache_read 1,435,936 · cache_create 636,251
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 18,783 · in 18 · cache_read 198,031 · cache_create 179,706
- **claude-opus-5-5**: 3 agent · 18 calls · out 13,568 · in 38 · cache_read 863,684 · cache_create 218,312

### S4 round 1 (thử lại hạ tầng) — wf_4c29e427-a3f (23 agent, 55,571 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5-5 | 12 | 8,149 | 24 | 815,031 | 88 |
| review:bugs | claude-opus-5-5 | 5 | 7,161 | 12 | 160,497 | 75 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 12 | 5,835 | 24 | 361,920 | 1097 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 9 | 5,166 | 18 | 264,408 | 1062 |
| synthesize:report | claude-sonnet-5-5 | 2 | 4,729 | 4 | 44,332 | 25 |
| triage | claude-sonnet-5-5 | 2 | 3,197 | 4 | 34,333 | 23 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,742 | 4 | 33,987 | 113 |
| review:measurement | claude-opus-5-5 | 5 | 2,736 | 10 | 188,616 | 29 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,567 | 4 | 3,300 | 569 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,635 | 4 | 34,001 | 7 |
| machine:node pipeline/scripts/phan-khu-s16-noi-t | claude-haiku-5-5 | 2 | 1,469 | 4 | 33,983 | 102 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,264 | 4 | 33,999 | 22 |
| machine:node --test --test-concurrency=1 --test- | claude-haiku-5-5 | 2 | 1,194 | 4 | 34,006 | 28 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,186 | 4 | 33,997 | 6 |
| machine:cd app && bash ../db/db-thu.sh oneinvest | claude-haiku-5-5 | 2 | 946 | 4 | 34,018 | 39 |
| machine:node --test --test-concurrency=1 --test- | claude-haiku-5-5 | 2 | 929 | 4 | 34,006 | 28 |
| machine:node --test --test-concurrency=1 --test- | claude-haiku-5-5 | 2 | 834 | 4 | 34,006 | 27 |
| machine:node --test --test-concurrency=1 --test- | claude-haiku-5-5 | 2 | 754 | 4 | 34,006 | 26 |
| machine:node --test --test-concurrency=1 --test- | claude-haiku-5-5 | 2 | 700 | 4 | 34,006 | 26 |
| machine:node --test --test-concurrency=1 --test- | claude-haiku-5-5 | 2 | 692 | 4 | 34,006 | 26 |
| machine:node --test --test-concurrency=1 --test- | claude-haiku-5-5 | 2 | 681 | 4 | 34,006 | 26 |
| machine:node --test --test-concurrency=1 --test- | claude-haiku-5-5 | 2 | 674 | 4 | 34,006 | 26 |
| capture:provenance | claude-sonnet-5-5 | 2 | 331 | 4 | 29,450 | 5 |


wall: 2929s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 17 | 29,268 | 1,105,661 | 2875 | 10:49:15 | 11:37:10 |
| review | 3 | 18,046 | 1,164,144 | 88 | 10:49:15 | 10:50:43 |
| triage | 1 | 3,197 | 34,333 | 23 | 11:37:10 | 11:37:33 |
| capture | 1 | 331 | 29,450 | 5 | 11:37:33 | 11:37:38 |
| synthesize | 1 | 4,729 | 44,332 | 25 | 11:37:38 | 11:38:04 |

- **claude-opus-5-5**: 3 agent · 22 calls · out 18,046 · in 46 · cache_read 1,164,144 · cache_create 240,909
- **claude-haiku-5-5**: 17 agent · 51 calls · out 29,268 · in 102 · cache_read 1,105,661 · cache_create 636,503
- **claude-sonnet-5-5**: 3 agent · 6 calls · out 8,257 · in 12 · cache_read 108,115 · cache_create 128,074

