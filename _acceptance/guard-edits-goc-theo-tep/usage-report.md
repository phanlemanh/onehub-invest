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

