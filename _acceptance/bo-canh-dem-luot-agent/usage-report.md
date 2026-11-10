### S4 round 1 — wf_f0b039bc-d1b (37 agent, 100,006 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 2 | 13,486 | 4 | 45,342 | 71 |
| review:bugs | claude-opus-5-5 | 10 | 10,405 | 22 | 455,062 | 107 |
| review:measurement | claude-opus-5-5 | 5 | 10,269 | 10 | 167,307 | 100 |
| review:conventions | claude-opus-5-5 | 14 | 10,191 | 30 | 726,112 | 108 |
| triage | claude-sonnet-5-5 | 2 | 5,975 | 4 | 34,226 | 36 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 15 | 5,829 | 30 | 470,692 | 1628 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 5,356 | 6 | 69,423 | 40 |
| machine:cd app && npm test | claude-haiku-5-5 | 4 | 3,261 | 8 | 61,832 | 655 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,669 | 4 | 28,286 | 36 |
| machine:node scripts/watchdog-l4d-agentdb/accept | claude-haiku-5-5 | 2 | 2,057 | 4 | 28,318 | 89 |
| judge:E12:domain-correctness | claude-sonnet-5-5 | 3 | 2,026 | 6 | 56,993 | 20 |
| judge:E12:operational-feasibility | claude-sonnet-5-5 | 3 | 1,888 | 6 | 60,502 | 21 |
| judge:E12:spec-alignment | claude-sonnet-5-5 | 3 | 1,857 | 6 | 60,432 | 16 |
| refute:doc-that.sh | claude-sonnet-5-5 | 5 | 1,803 | 10 | 116,238 | 17 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,797 | 4 | 28,304 | 7 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,672 | 4 | 28,298 | 7 |
| refute:doc-that.sh | claude-sonnet-5-5 | 5 | 1,412 | 10 | 114,991 | 13 |
| refute:acceptance.mjs | claude-sonnet-5-5 | 4 | 1,309 | 8 | 85,155 | 13 |
| refute:acceptance.mjs | claude-sonnet-5-5 | 5 | 1,228 | 10 | 123,409 | 12 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,185 | 4 | 28,309 | 31 |
| refute:doc-that.sh | claude-sonnet-5-5 | 5 | 1,091 | 10 | 112,953 | 11 |
| machine:node scripts/audit-p1-resilience/accepta | claude-haiku-5-5 | 2 | 1,009 | 4 | 28,314 | 7 |
| refute:acceptance.mjs | claude-sonnet-5-5 | 4 | 997 | 8 | 83,613 | 10 |
| refute:acceptance.mjs | claude-sonnet-5-5 | 3 | 992 | 6 | 56,723 | 10 |
| refute:acceptance.mjs | claude-sonnet-5-5 | 3 | 977 | 6 | 56,236 | 10 |
| refute:acceptance.mjs | claude-sonnet-5-5 | 3 | 974 | 6 | 55,406 | 9 |
| machine:node scripts/audit-p1-resilience/accepta | claude-haiku-5-5 | 2 | 916 | 4 | 28,317 | 5 |
| refute:acceptance.mjs | claude-sonnet-5-5 | 4 | 916 | 8 | 86,594 | 10 |
| refute:acceptance.mjs | claude-sonnet-5-5 | 3 | 904 | 6 | 57,449 | 9 |
| refute:doc-that.sh | claude-sonnet-5-5 | 2 | 840 | 4 | 27,122 | 8 |
| refute:acceptance.mjs | claude-sonnet-5-5 | 2 | 836 | 4 | 26,978 | 8 |
| machine:env -i PATH=/usr/bin:/bin:/usr/sbin:/sbi | claude-haiku-5-5 | 2 | 751 | 4 | 28,370 | 5 |
| refute:acceptance.mjs | claude-sonnet-5-5 | 3 | 742 | 6 | 54,861 | 8 |
| refute:acceptance.mjs | claude-sonnet-5-5 | 4 | 712 | 8 | 83,790 | 8 |
| refute:acceptance.mjs | claude-sonnet-5-5 | 3 | 690 | 6 | 55,240 | 7 |
| machine:for f in docs/ops/runtime-map.md docs/op | claude-haiku-5-5 | 2 | 650 | 4 | 28,373 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 334 | 4 | 23,896 | 4 |


wall: 2492s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 5,356 | 69,423 | 40 | 19:28:57 | 19:29:37 |
| machine | 11 | 21,796 | 787,413 | 2364 | 19:28:57 | 20:08:20 |
| judge | 3 | 5,771 | 177,927 | 24 | 19:28:57 | 19:29:21 |
| review | 3 | 30,865 | 1,348,481 | 108 | 19:28:57 | 19:30:45 |
| triage | 1 | 5,975 | 34,226 | 36 | 20:08:20 | 20:08:56 |
| refute | 16 | 16,423 | 1,196,758 | 18 | 20:08:56 | 20:09:14 |
| capture | 1 | 334 | 23,896 | 4 | 20:09:14 | 20:09:18 |
| synthesize | 1 | 13,486 | 45,342 | 71 | 20:09:18 | 20:10:29 |

- **claude-sonnet-5-5**: 23 agent · 76 calls · out 47,345 · in 152 · cache_read 1,547,572 · cache_create 718,691
- **claude-opus-5-5**: 3 agent · 29 calls · out 30,865 · in 62 · cache_read 1,348,481 · cache_create 206,511
- **claude-haiku-5-5**: 11 agent · 37 calls · out 21,796 · in 74 · cache_read 787,413 · cache_create 354,529

