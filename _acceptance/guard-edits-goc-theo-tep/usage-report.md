### S4 round 1 — wf_026fcfae-05c (19 agent, 110,043 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 8 | 25,777 | 16 | 360,972 | 251 |
| review:bugs | claude-opus-5-5 | 7 | 21,170 | 14 | 330,789 | 276 |
| review:conventions | claude-opus-5-5 | 6 | 17,179 | 12 | 272,747 | 177 |
| synthesize:report | claude-sonnet-5-5 | 3 | 11,587 | 6 | 88,132 | 63 |
| triage | claude-sonnet-5-5 | 2 | 5,904 | 4 | 26,284 | 43 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,109 | 6 | 54,486 | 37 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 3,148 | 4 | 19,614 | 27 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,742 | 4 | 22,752 | 71 |
| refute:dot-bien.sh | claude-sonnet-5-5 | 5 | 2,597 | 10 | 108,634 | 27 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,404 | 4 | 3,140 | 393 |
| machine:bash _acceptance/guard-edits-goc-theo-te | claude-haiku-5-5 | 2 | 2,163 | 4 | 22,793 | 63 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 2,092 | 4 | 22,766 | 10 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,087 | 4 | 22,772 | 10 |
| machine:bash .claude/hooks/tests/guard-edits.sel | claude-haiku-5-5 | 2 | 1,682 | 4 | 22,784 | 14 |
| refute:guard-edits.selftest.sh | claude-sonnet-5-5 | 4 | 1,537 | 8 | 67,716 | 18 |
| machine:bash _acceptance/guard-edits-goc-theo-te | claude-haiku-5-5 | 2 | 1,377 | 4 | 22,793 | 8 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,112 | 4 | 22,777 | 20 |
| refute:guard-edits.selftest.sh | claude-sonnet-5-5 | 3 | 1,037 | 6 | 43,389 | 12 |
| capture:provenance | claude-sonnet-5-5 | 2 | 339 | 4 | 18,411 | 5 |


wall: 688s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,109 | 54,486 | 37 | 23:19:02 | 23:19:39 |
| machine | 9 | 18,807 | 182,191 | 541 | 23:19:02 | 23:28:03 |
| review | 3 | 64,126 | 964,508 | 277 | 23:19:02 | 23:23:39 |
| triage | 1 | 5,904 | 26,284 | 43 | 23:28:04 | 23:28:47 |
| refute | 3 | 5,171 | 219,739 | 29 | 23:28:49 | 23:29:18 |
| capture | 1 | 339 | 18,411 | 5 | 23:29:20 | 23:29:25 |
| synthesize | 1 | 11,587 | 88,132 | 63 | 23:29:27 | 23:30:30 |

- **claude-opus-5-5**: 3 agent · 21 calls · out 64,126 · in 42 · cache_read 964,508 · cache_create 238,294
- **claude-sonnet-5-5**: 7 agent · 22 calls · out 27,110 · in 44 · cache_read 407,052 · cache_create 215,163
- **claude-haiku-5-5**: 9 agent · 18 calls · out 18,807 · in 36 · cache_read 182,191 · cache_create 211,314

### S4 round 2 — wf_fa66db9c-1e5 (17 agent, 85,711 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 7 | 22,771 | 14 | 412,735 | 357 |
| review:measurement | claude-opus-5-5 | 4 | 20,465 | 8 | 171,553 | 195 |
| review:conventions | claude-opus-5-5 | 6 | 10,346 | 12 | 190,103 | 101 |
| synthesize:report | claude-sonnet-5-5 | 4 | 8,261 | 8 | 134,791 | 55 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 4,109 | 6 | 54,964 | 36 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,576 | 4 | 3,140 | 472 |
| triage | claude-sonnet-5-5 | 2 | 2,383 | 4 | 23,052 | 20 |
| machine:bash _acceptance/guard-edits-goc-theo-te | claude-haiku-5-5 | 2 | 2,187 | 4 | 23,032 | 98 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,137 | 4 | 23,011 | 9 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,106 | 4 | 22,991 | 84 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,745 | 4 | 23,005 | 9 |
| machine:bash _acceptance/guard-edits-goc-theo-te | claude-haiku-5-5 | 2 | 1,546 | 4 | 23,032 | 9 |
| refute:dot-bien.sh | claude-sonnet-5-5 | 3 | 1,412 | 6 | 45,564 | 14 |
| machine:bash .claude/hooks/tests/guard-edits.sel | claude-haiku-5-5 | 2 | 1,382 | 4 | 23,023 | 15 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,046 | 4 | 23,016 | 17 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 821 | 4 | 22,993 | 20 |
| capture:provenance | claude-sonnet-5-5 | 2 | 418 | 4 | 18,650 | 7 |


wall: 729s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,109 | 54,964 | 36 | 00:44:16 | 00:44:52 |
| machine | 9 | 15,546 | 187,243 | 620 | 00:44:16 | 00:54:36 |
| review | 3 | 53,582 | 774,391 | 358 | 00:44:16 | 00:50:14 |
| triage | 1 | 2,383 | 23,052 | 20 | 00:54:38 | 00:54:57 |
| refute | 1 | 1,412 | 45,564 | 14 | 00:54:59 | 00:55:13 |
| capture | 1 | 418 | 18,650 | 7 | 00:55:15 | 00:55:22 |
| synthesize | 1 | 8,261 | 134,791 | 55 | 00:55:30 | 00:56:25 |

- **claude-opus-5-5**: 3 agent · 17 calls · out 53,582 · in 34 · cache_read 774,391 · cache_create 253,793
- **claude-sonnet-5-5**: 5 agent · 14 calls · out 16,583 · in 28 · cache_read 277,021 · cache_create 168,292
- **claude-haiku-5-5**: 9 agent · 18 calls · out 15,546 · in 36 · cache_read 187,243 · cache_create 209,539

### S4 round 3 — wf_d95be9f5-d59 (15 agent, 84,435 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 7 | 24,461 | 14 | 330,177 | 307 |
| review:measurement | claude-opus-5-5 | 5 | 18,381 | 10 | 184,698 | 177 |
| review:conventions | claude-opus-5-5 | 5 | 13,370 | 10 | 162,119 | 129 |
| synthesize:report | claude-sonnet-5-5 | 8 | 8,832 | 16 | 326,791 | 61 |
| triage | claude-sonnet-5-5 | 2 | 3,171 | 4 | 24,100 | 24 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 3,064 | 4 | 19,840 | 25 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,770 | 4 | 22,978 | 71 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,497 | 4 | 22,984 | 223 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,170 | 4 | 22,998 | 11 |
| machine:bash _acceptance/guard-edits-goc-theo-te | claude-haiku-5-5 | 2 | 1,674 | 4 | 23,019 | 10 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,506 | 4 | 22,992 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 926 | 4 | 23,003 | 17 |
| machine:bash _acceptance/guard-edits-goc-theo-te | claude-haiku-5-5 | 2 | 702 | 4 | 23,019 | 77 |
| machine:bash .claude/hooks/tests/guard-edits.sel | claude-haiku-5-5 | 2 | 573 | 4 | 23,010 | 11 |
| capture:provenance | claude-sonnet-5-5 | 2 | 338 | 4 | 18,637 | 5 |


wall: 462s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 9 | 15,882 | 203,843 | 365 | 01:52:36 | 01:58:41 |
| review | 3 | 56,212 | 676,994 | 308 | 01:52:36 | 01:57:44 |
| triage | 1 | 3,171 | 24,100 | 24 | 01:58:43 | 01:59:07 |
| capture | 1 | 338 | 18,637 | 5 | 01:59:09 | 01:59:15 |
| synthesize | 1 | 8,832 | 326,791 | 61 | 01:59:17 | 02:00:18 |

- **claude-opus-5-5**: 3 agent · 17 calls · out 56,212 · in 34 · cache_read 676,994 · cache_create 225,739
- **claude-sonnet-5-5**: 3 agent · 12 calls · out 12,341 · in 24 · cache_read 369,528 · cache_create 108,873
- **claude-haiku-5-5**: 9 agent · 18 calls · out 15,882 · in 36 · cache_read 203,843 · cache_create 193,608

