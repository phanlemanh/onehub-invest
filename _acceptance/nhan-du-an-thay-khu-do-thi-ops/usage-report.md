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

### S4 round wf_0a43af13-5ad — wf_0a43af13-5ad (16 agent, 31,403 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,296 | 6 | 75,184 | 44 |
| synthesize:report | claude-sonnet-5-5 | 2 | 3,796 | 4 | 37,616 | 23 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 9 | 2,880 | 18 | 249,788 | 852 |
| review:bugs | claude-opus-5-5 | 7 | 2,490 | 14 | 282,410 | 30 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 4 | 2,398 | 8 | 69,997 | 757 |
| machine:cd app && npm test | claude-haiku-5-5 | 5 | 2,270 | 10 | 104,367 | 886 |
| review:conventions | claude-opus-5-5 | 7 | 1,870 | 14 | 275,566 | 21 |
| review:measurement | claude-opus-5-5 | 4 | 1,815 | 8 | 119,413 | 20 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 4 | 1,738 | 8 | 70,238 | 611 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,722 | 4 | 32,952 | 7 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,523 | 4 | 34,337 | 30 |
| machine:for f in app/src/components/ops/quality/ | claude-haiku-5-5 | 2 | 1,200 | 4 | 33,108 | 7 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,171 | 4 | 32,948 | 5 |
| machine:node --test scripts/nhan-du-an-thay-khu- | claude-haiku-5-5 | 2 | 1,150 | 4 | 32,936 | 6 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 726 | 4 | 32,938 | 97 |
| capture:provenance | claude-sonnet-5-5 | 2 | 358 | 4 | 28,407 | 4 |


wall: 2385s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,296 | 75,184 | 44 | 17:32:29 | 17:33:13 |
| machine | 10 | 16,778 | 693,609 | 2358 | 17:32:29 | 18:11:47 |
| review | 3 | 6,175 | 677,389 | 31 | 17:32:29 | 17:33:00 |
| capture | 1 | 358 | 28,407 | 4 | 18:11:47 | 18:11:51 |
| synthesize | 1 | 3,796 | 37,616 | 23 | 18:11:51 | 18:12:14 |

- **claude-sonnet-5-5**: 3 agent · 7 calls · out 8,450 · in 14 · cache_read 141,207 · cache_create 121,187
- **claude-haiku-5-5**: 10 agent · 34 calls · out 16,778 · in 68 · cache_read 693,609 · cache_create 436,116
- **claude-opus-5-5**: 3 agent · 18 calls · out 6,175 · in 36 · cache_read 677,389 · cache_create 147,256

### S4 round wf_2b03aa99-7a0 — wf_2b03aa99-7a0 (16 agent, 34,533 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 9 | 5,312 | 18 | 246,335 | 876 |
| synthesize:report | claude-sonnet-5-5 | 2 | 4,654 | 4 | 38,421 | 28 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 7 | 3,757 | 14 | 174,082 | 704 |
| review:measurement | claude-opus-5-5 | 6 | 3,202 | 12 | 212,582 | 33 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 2,760 | 4 | 32,960 | 83 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 1,769 | 4 | 32,974 | 7 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 1,745 | 4 | 32,970 | 7 |
| machine:for f in app/src/components/ops/quality/ | claude-haiku-5-5 | 2 | 1,622 | 4 | 33,130 | 9 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 5 | 1,620 | 10 | 107,967 | 684 |
| review:bugs | claude-opus-5-5 | 6 | 1,573 | 12 | 223,431 | 19 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,426 | 4 | 34,046 | 19 |
| review:conventions | claude-opus-5-5 | 5 | 1,396 | 10 | 165,097 | 17 |
| machine:cd app && npm test | claude-haiku-5-5 | 4 | 1,188 | 8 | 70,230 | 689 |
| machine:node --test scripts/nhan-du-an-thay-khu- | claude-haiku-5-5 | 2 | 1,106 | 4 | 32,958 | 6 |
| triage | claude-sonnet-5-5 | 2 | 1,059 | 4 | 30,807 | 9 |
| capture:provenance | claude-sonnet-5-5 | 2 | 344 | 4 | 28,429 | 3 |


wall: 2420s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 10 | 22,305 | 797,652 | 2380 | 18:13:58 | 18:53:38 |
| review | 3 | 6,171 | 601,110 | 34 | 18:13:58 | 18:14:32 |
| triage | 1 | 1,059 | 30,807 | 9 | 18:53:38 | 18:53:47 |
| capture | 1 | 344 | 28,429 | 3 | 18:53:47 | 18:53:50 |
| synthesize | 1 | 4,654 | 38,421 | 28 | 18:53:50 | 18:54:18 |

- **claude-haiku-5-5**: 10 agent · 37 calls · out 22,305 · in 74 · cache_read 797,652 · cache_create 435,775
- **claude-sonnet-5-5**: 3 agent · 6 calls · out 6,057 · in 12 · cache_read 97,657 · cache_create 117,332
- **claude-opus-5-5**: 3 agent · 17 calls · out 6,171 · in 34 · cache_read 601,110 · cache_create 147,804

### S4 round wf_37ef9670-3df — wf_37ef9670-3df (14 agent, 28,418 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 7 | 4,391 | 14 | 174,451 | 877 |
| machine:node scripts/suite-neu-doi.mjs pipeline_ | claude-haiku-5-5 | 5 | 3,590 | 10 | 104,660 | 700 |
| synthesize:report | claude-sonnet-5-5 | 3 | 3,340 | 6 | 86,780 | 20 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,104 | 6 | 71,844 | 21 |
| machine:node scripts/suite-neu-doi.mjs app_ui -- | claude-haiku-5-5 | 2 | 2,664 | 4 | 3,300 | 451 |
| review:measurement | claude-opus-5-5 | 4 | 2,662 | 8 | 117,939 | 30 |
| machine:node scripts/suite-neu-doi.mjs portal_st | claude-haiku-5-5 | 2 | 2,066 | 4 | 33,016 | 8 |
| review:bugs | claude-opus-5-5 | 4 | 1,524 | 8 | 113,839 | 19 |
| machine:node --test scripts/nhan-du-an-thay-khu- | claude-haiku-5-5 | 2 | 1,485 | 4 | 33,004 | 7 |
| machine:node scripts/suite-neu-doi.mjs app -- 'c | claude-haiku-5-5 | 2 | 1,282 | 4 | 33,018 | 17 |
| machine:node scripts/suite-neu-doi.mjs agent -- | claude-haiku-5-5 | 2 | 687 | 4 | 33,006 | 61 |
| machine:node scripts/suite-neu-doi.mjs ui_lint_r | claude-haiku-5-5 | 2 | 627 | 4 | 33,020 | 4 |
| review:conventions | claude-opus-5-5 | 3 | 552 | 6 | 64,060 | 8 |
| capture:provenance | claude-sonnet-5-5 | 2 | 444 | 4 | 28,475 | 4 |


wall: 2141s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,104 | 71,844 | 21 | 18:56:10 | 18:56:30 |
| machine | 8 | 16,792 | 447,475 | 2117 | 18:56:10 | 19:31:27 |
| review | 3 | 4,738 | 295,838 | 32 | 18:56:10 | 18:56:41 |
| capture | 1 | 444 | 28,475 | 4 | 19:31:27 | 19:31:31 |
| synthesize | 1 | 3,340 | 86,780 | 20 | 19:31:31 | 19:31:51 |

- **claude-haiku-5-5**: 8 agent · 24 calls · out 16,792 · in 48 · cache_read 447,475 · cache_create 341,928
- **claude-sonnet-5-5**: 3 agent · 8 calls · out 6,888 · in 16 · cache_read 187,099 · cache_create 121,032
- **claude-opus-5-5**: 3 agent · 11 calls · out 4,738 · in 22 · cache_read 295,838 · cache_create 128,235

