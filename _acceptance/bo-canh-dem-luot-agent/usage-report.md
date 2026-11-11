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

### S4 round 2 — wf_70b9d76c-50a (20 agent, 52,478 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 2 | 8,028 | 4 | 40,303 | 45 |
| review:bugs | claude-opus-5-5 | 10 | 7,313 | 20 | 459,205 | 83 |
| review:conventions | claude-opus-5-5 | 9 | 5,251 | 18 | 378,012 | 56 |
| review:measurement | claude-opus-5-5 | 4 | 4,590 | 8 | 117,537 | 46 |
| triage | claude-sonnet-5-5 | 2 | 3,333 | 4 | 29,329 | 25 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 9 | 3,205 | 18 | 220,714 | 1091 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,695 | 4 | 28,944 | 35 |
| judge:E12:spec-alignment | claude-sonnet-5-5 | 4 | 2,658 | 10 | 106,695 | 28 |
| judge:E12:operational-feasibility | claude-sonnet-5-5 | 3 | 2,320 | 6 | 65,140 | 20 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,016 | 4 | 28,962 | 8 |
| judge:E12:domain-correctness | claude-sonnet-5-5 | 3 | 1,986 | 6 | 61,508 | 19 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,598 | 4 | 28,956 | 7 |
| machine:node scripts/audit-p1-resilience/accepta | claude-haiku-5-5 | 3 | 1,443 | 8 | 58,411 | 9 |
| machine:cd app && npm test | claude-haiku-5-5 | 3 | 1,303 | 6 | 32,628 | 623 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,254 | 4 | 28,967 | 21 |
| machine:node scripts/audit-p1-resilience/accepta | claude-haiku-5-5 | 2 | 972 | 4 | 28,975 | 5 |
| machine:env -i PATH=/usr/bin:/bin:/usr/sbin:/sbi | claude-haiku-5-5 | 2 | 874 | 4 | 29,028 | 6 |
| machine:for f in docs/ops/runtime-map.md docs/op | claude-haiku-5-5 | 2 | 788 | 4 | 29,031 | 5 |
| machine:node scripts/watchdog-l4d-agentdb/accept | claude-haiku-5-5 | 2 | 520 | 4 | 28,976 | 107 |
| capture:provenance | claude-sonnet-5-5 | 2 | 331 | 4 | 24,443 | 7 |


wall: 1861s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 11 | 16,668 | 543,592 | 1784 | 13:12:59 | 13:42:44 |
| review | 3 | 17,154 | 954,754 | 84 | 13:12:59 | 13:14:24 |
| judge | 3 | 6,964 | 233,343 | 32 | 13:12:59 | 13:13:32 |
| triage | 1 | 3,333 | 29,329 | 25 | 13:42:44 | 13:43:09 |
| capture | 1 | 331 | 24,443 | 7 | 13:43:09 | 13:43:15 |
| synthesize | 1 | 8,028 | 40,303 | 45 | 13:43:15 | 13:44:01 |

- **claude-sonnet-5-5**: 6 agent · 16 calls · out 18,656 · in 34 · cache_read 327,418 · cache_create 234,690
- **claude-opus-5-5**: 3 agent · 23 calls · out 17,154 · in 46 · cache_read 954,754 · cache_create 190,167
- **claude-haiku-5-5**: 11 agent · 31 calls · out 16,668 · in 64 · cache_read 543,592 · cache_create 350,294

