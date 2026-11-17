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

### S4 round 2 — wf_34ffbb71-0f5 (18 agent, 40,405 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 11 | 7,075 | 22 | 500,803 | 75 |
| review:bugs | claude-opus-5-5 | 12 | 4,599 | 24 | 503,905 | 58 |
| machine:node scripts/suite-neu-doi.mjs pipeline | claude-haiku-5-5 | 8 | 4,533 | 16 | 184,039 | 1096 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 6 | 3,978 | 12 | 121,728 | 811 |
| synthesize:report | claude-sonnet-5-5 | 2 | 3,674 | 4 | 35,090 | 25 |
| review:conventions | claude-opus-5-5 | 9 | 3,181 | 18 | 336,710 | 38 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,766 | 4 | 25,261 | 45 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,262 | 4 | 28,460 | 9 |
| machine:node --test scripts/*.test.mjs | claude-haiku-5-5 | 2 | 1,863 | 4 | 28,424 | 242 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,097 | 4 | 28,462 | 23 |
| machine:node --test --test-name-pattern=S4V-AC-6 | claude-haiku-5-5 | 2 | 870 | 4 | 28,494 | 6 |
| machine:node --test --test-name-pattern=S4V-AC-1 | claude-haiku-5-5 | 2 | 774 | 4 | 28,455 | 7 |
| machine:node --test --test-name-pattern=S4V-AC-2 | claude-haiku-5-5 | 2 | 755 | 4 | 28,455 | 10 |
| machine:node --test --test-name-pattern=S4V-AC-5 | claude-haiku-5-5 | 2 | 712 | 4 | 28,455 | 6 |
| machine:node --test --test-name-pattern=S4V-AC-4 | claude-haiku-5-5 | 2 | 690 | 4 | 28,455 | 8 |
| machine:node --test --test-name-pattern=S4V-AC-3 | claude-haiku-5-5 | 2 | 673 | 4 | 28,455 | 5 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 577 | 4 | 28,464 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 326 | 4 | 24,020 | 7 |


wall: 2021s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 13 | 21,550 | 615,607 | 1989 | 18:52:22 | 19:25:31 |
| review | 3 | 14,855 | 1,341,418 | 76 | 18:52:22 | 18:53:38 |
| capture | 1 | 326 | 24,020 | 7 | 19:25:31 | 19:25:38 |
| synthesize | 1 | 3,674 | 35,090 | 25 | 19:25:38 | 19:26:03 |

- **claude-opus-5-5**: 3 agent · 32 calls · out 14,855 · in 64 · cache_read 1,341,418 · cache_create 174,025
- **claude-haiku-5-5**: 13 agent · 36 calls · out 21,550 · in 72 · cache_read 615,607 · cache_create 400,167
- **claude-sonnet-5-5**: 2 agent · 4 calls · out 4,000 · in 8 · cache_read 59,110 · cache_create 73,435

### S4 round 3 — wf_e1511fa5-83e (23 agent, 137,189 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:conventions | claude-opus-5 | 30 | 34,422 | 60 | 2,311,276 | 483 |
| review:bugs | claude-opus-5 | 22 | 33,706 | 44 | 1,558,031 | 485 |
| review:measurement | claude-opus-5 | 14 | 23,909 | 28 | 896,421 | 334 |
| synthesize:report | claude-sonnet-5-5 | 2 | 8,586 | 4 | 49,999 | 48 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 6,866 | 6 | 81,801 | 134 |
| triage | claude-sonnet-5-5 | 2 | 5,180 | 4 | 38,666 | 35 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 6 | 3,852 | 12 | 137,896 | 819 |
| machine:node --test scripts/*.test.mjs | claude-haiku-5-5 | 10 | 3,738 | 20 | 299,881 | 1202 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 6 | 3,698 | 12 | 142,010 | 864 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,668 | 4 | 6,646 | 565 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,728 | 4 | 32,722 | 8 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,268 | 4 | 32,720 | 32 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,109 | 4 | 32,718 | 5 |
| machine:node --test scripts/dung-worktree-cham.t | claude-haiku-5-5 | 2 | 934 | 4 | 32,694 | 12 |
| machine:node --test --test-name-pattern=S4V-AC-6 | claude-haiku-5-5 | 2 | 769 | 4 | 32,752 | 8 |
| machine:node --test --test-name-pattern=S4V-AC-2 | claude-haiku-5-5 | 2 | 676 | 4 | 32,713 | 12 |
| machine:node --test --test-name-pattern=S4V-AC-4 | claude-haiku-5-5 | 2 | 662 | 4 | 32,713 | 12 |
| machine:node --test --test-name-pattern=S4V-AC-1 | claude-haiku-5-5 | 2 | 660 | 4 | 32,713 | 11 |
| machine:node --test --test-name-pattern=S4V-AC-3 | claude-haiku-5-5 | 2 | 622 | 4 | 32,713 | 7 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 618 | 4 | 29,385 | 72 |
| refute:suite-neu-doi.mjs | claude-sonnet-5-5 | 2 | 612 | 4 | 28,557 | 6 |
| machine:node --test --test-name-pattern=S4V-AC-5 | claude-haiku-5-5 | 2 | 581 | 4 | 32,713 | 11 |
| capture:provenance | claude-sonnet-5-5 | 2 | 325 | 4 | 28,121 | 3 |


wall: 2457s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 6,866 | 81,801 | 134 | 14:06:17 | 14:08:31 |
| review | 3 | 92,037 | 4,765,728 | 486 | 14:06:17 | 14:14:23 |
| machine | 15 | 23,583 | 942,989 | 2365 | 14:06:17 | 14:45:42 |
| triage | 1 | 5,180 | 38,666 | 35 | 14:45:42 | 14:46:17 |
| refute | 1 | 612 | 28,557 | 6 | 14:46:17 | 14:46:23 |
| capture | 1 | 325 | 28,121 | 3 | 14:46:23 | 14:46:26 |
| synthesize | 1 | 8,586 | 49,999 | 48 | 14:46:26 | 14:47:14 |

- **claude-opus-5**: 3 agent · 66 calls · out 92,037 · in 132 · cache_read 4,765,728 · cache_create 306,531
- **claude-sonnet-5-5**: 5 agent · 11 calls · out 21,569 · in 22 · cache_read 227,144 · cache_create 215,151
- **claude-haiku-5-5**: 15 agent · 46 calls · out 23,583 · in 92 · cache_read 942,989 · cache_create 578,710

### S4 round 4 — wf_75c728cd-214 (23 agent, 93,612 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5 | 15 | 23,946 | 30 | 942,016 | 330 |
| review:measurement | claude-opus-5 | 13 | 22,111 | 26 | 876,673 | 336 |
| review:conventions | claude-opus-5 | 9 | 8,557 | 18 | 434,959 | 148 |
| synthesize:report | claude-sonnet-5-5 | 4 | 6,972 | 8 | 158,541 | 41 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 6,257 | 6 | 81,260 | 100 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 8 | 5,102 | 16 | 209,666 | 1007 |
| machine:node --test scripts/*.test.mjs | claude-haiku-5-5 | 8 | 4,066 | 16 | 210,725 | 1099 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 8 | 3,207 | 16 | 211,399 | 1020 |
| triage | claude-sonnet-5-5 | 2 | 2,926 | 4 | 33,790 | 21 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,742 | 4 | 32,707 | 8 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,298 | 4 | 33,245 | 21 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,041 | 4 | 32,703 | 5 |
| machine:node --test --test-name-pattern=S4V-AC-6 | claude-haiku-5-5 | 2 | 764 | 4 | 33,277 | 7 |
| machine:node --test --test-name-pattern=S4V-AC-2 | claude-haiku-5-5 | 2 | 746 | 4 | 33,238 | 11 |
| machine:node --test --test-name-pattern=S4V-AC-4 | claude-haiku-5-5 | 2 | 744 | 4 | 33,238 | 10 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 727 | 4 | 29,910 | 81 |
| machine:node --test --test-name-pattern=S4V-AC-1 | claude-haiku-5-5 | 2 | 712 | 4 | 33,238 | 7 |
| machine:node --test --test-name-pattern=S4V-AC-5 | claude-haiku-5-5 | 2 | 659 | 4 | 33,238 | 5 |
| machine:node --test --test-name-pattern=S4V-AC-3 | claude-haiku-5-5 | 2 | 628 | 4 | 33,238 | 5 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 527 | 4 | 0 | 527 |
| capture:provenance | claude-sonnet-5-5 | 2 | 326 | 4 | 28,106 | 3 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 1 | 289 | 2 | 3,323 | 317 |
| machine:node --test scripts/*.test.mjs | claude-haiku-5-5 | 1 | 265 | 2 | 3,323 | 417 |


wall: 10763s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| review | 3 | 54,614 | 2,253,648 | 337 | 22:31:21 | 22:36:58 |
| baseline | 1 | 6,257 | 81,260 | 100 | 22:31:21 | 22:33:01 |
| machine | 16 | 22,517 | 966,468 | 10698 | 22:31:21 | 01:29:39 |
| triage | 1 | 2,926 | 33,790 | 21 | 01:29:39 | 01:29:59 |
| capture | 1 | 326 | 28,106 | 3 | 01:29:59 | 01:30:03 |
| synthesize | 1 | 6,972 | 158,541 | 41 | 01:30:03 | 01:30:44 |

- **claude-opus-5**: 3 agent · 37 calls · out 54,614 · in 74 · cache_read 2,253,648 · cache_create 257,495
- **claude-sonnet-5-5**: 4 agent · 11 calls · out 16,481 · in 22 · cache_read 301,697 · cache_create 173,642
- **claude-haiku-5-5**: 16 agent · 48 calls · out 22,517 · in 96 · cache_read 966,468 · cache_create 608,758

