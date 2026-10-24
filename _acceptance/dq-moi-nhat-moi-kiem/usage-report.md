### S4 round 1 — wf_a7e805fe-352 (19 agent, 52,892 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 11 | 10,240 | 22 | 377,721 | 115 |
| review:measurement | claude-opus-5-5 | 6 | 7,186 | 12 | 155,107 | 76 |
| synthesize:report | claude-sonnet-5-5 | 4 | 6,372 | 8 | 103,269 | 44 |
| refute:dq-checks.ts | claude-sonnet-5-5 | 7 | 4,941 | 14 | 122,836 | 47 |
| review:conventions | claude-opus-5-5 | 8 | 3,603 | 16 | 234,888 | 45 |
| triage | claude-sonnet-5-5 | 2 | 2,881 | 4 | 20,240 | 23 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,664 | 4 | 16,999 | 22 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,468 | 4 | 19,416 | 26 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,341 | 4 | 20,062 | 20 |
| refute:dq-moi-nhat.test.tsx | claude-sonnet-5-5 | 3 | 1,835 | 6 | 47,289 | 18 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,712 | 4 | 20,070 | 9 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,665 | 4 | 20,076 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,127 | 4 | 20,081 | 12 |
| machine:cd app && node --import tsx ../scripts/d | claude-haiku-5-5 | 2 | 898 | 4 | 20,090 | 7 |
| judge:E6:spec-alignment | claude-sonnet-5-5 | 3 | 716 | 6 | 41,774 | 8 |
| judge:E6:operational-feasibility | claude-sonnet-5-5 | 2 | 681 | 4 | 20,229 | 6 |
| judge:E6:domain-correctness | claude-sonnet-5-5 | 2 | 656 | 4 | 16,699 | 9 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 560 | 4 | 20,058 | 7 |
| capture:provenance | claude-sonnet-5-5 | 2 | 346 | 4 | 15,799 | 5 |


wall: 243s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,468 | 19,416 | 26 | 14:48:26 | 14:48:52 |
| machine | 7 | 10,967 | 137,436 | 89 | 14:48:26 | 14:49:55 |
| judge | 3 | 2,053 | 78,702 | 12 | 14:48:26 | 14:48:38 |
| review | 3 | 21,029 | 767,716 | 116 | 14:48:26 | 14:50:23 |
| triage | 1 | 2,881 | 20,240 | 23 | 14:50:25 | 14:50:47 |
| refute | 2 | 6,776 | 170,125 | 47 | 14:50:49 | 14:51:36 |
| capture | 1 | 346 | 15,799 | 5 | 14:51:38 | 14:51:43 |
| synthesize | 1 | 6,372 | 103,269 | 44 | 14:51:45 | 14:52:29 |

- **claude-opus-5-5**: 3 agent · 25 calls · out 21,029 · in 50 · cache_read 767,716 · cache_create 131,323
- **claude-sonnet-5-5**: 9 agent · 27 calls · out 20,896 · in 54 · cache_read 407,551 · cache_create 220,403
- **claude-haiku-5-5**: 7 agent · 14 calls · out 10,967 · in 28 · cache_read 137,436 · cache_create 130,202

### S4 round 2 — wf_944085d2-f23 (16 agent, 24,077 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 4 | 5,529 | 8 | 101,088 | 37 |
| review:measurement | claude-opus-5-5 | 4 | 2,800 | 8 | 72,163 | 36 |
| review:conventions | claude-opus-5-5 | 4 | 2,117 | 8 | 68,356 | 25 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,101 | 4 | 20,072 | 18 |
| review:bugs | claude-opus-5-5 | 6 | 1,895 | 12 | 128,605 | 28 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,673 | 4 | 20,068 | 9 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,567 | 4 | 20,091 | 13 |
| machine:cd app && node --import tsx ../scripts/d | claude-haiku-5-5 | 2 | 991 | 4 | 20,100 | 7 |
| triage | claude-sonnet-5-5 | 2 | 873 | 4 | 18,331 | 11 |
| judge:E6:domain-correctness | claude-sonnet-5-5 | 2 | 798 | 4 | 16,709 | 7 |
| judge:E6:operational-feasibility | claude-sonnet-5-5 | 2 | 757 | 4 | 20,239 | 9 |
| judge:E6:spec-alignment | claude-sonnet-5-5 | 2 | 739 | 4 | 20,237 | 8 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 652 | 4 | 20,086 | 6 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 628 | 4 | 17,009 | 17 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 531 | 4 | 20,080 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 426 | 4 | 18,723 | 6 |


wall: 138s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| machine | 7 | 8,143 | 137,506 | 79 | 14:55:14 | 14:56:33 |
| judge | 3 | 2,294 | 57,185 | 10 | 14:55:14 | 14:55:24 |
| review | 3 | 6,812 | 269,124 | 37 | 14:55:14 | 14:55:51 |
| triage | 1 | 873 | 18,331 | 11 | 14:56:35 | 14:56:45 |
| capture | 1 | 426 | 18,723 | 6 | 14:56:47 | 14:56:53 |
| synthesize | 1 | 5,529 | 101,088 | 37 | 14:56:55 | 14:57:32 |

- **claude-sonnet-5-5**: 6 agent · 14 calls · out 9,122 · in 28 · cache_read 195,327 · cache_create 134,301
- **claude-opus-5-5**: 3 agent · 14 calls · out 6,812 · in 28 · cache_read 269,124 · cache_create 87,544
- **claude-haiku-5-5**: 7 agent · 14 calls · out 8,143 · in 28 · cache_read 137,506 · cache_create 130,216

