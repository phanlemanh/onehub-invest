### S4 round 1 — wf_4e1171d4-adb (24 agent, 97,457 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:measurement | claude-opus-5-5 | 12 | 14,087 | 24 | 506,235 | 156 |
| ui:E10 | claude-sonnet-5-5 | 26 | 13,786 | 52 | 3,105,500 | 261 |
| ui:E13 | claude-sonnet-5-5 | 19 | 12,949 | 38 | 2,045,124 | 251 |
| review:conventions | claude-opus-5-5 | 29 | 11,238 | 58 | 1,672,254 | 138 |
| synthesize:report | claude-sonnet-5-5 | 5 | 10,988 | 10 | 164,486 | 81 |
| review:bugs | claude-opus-5-5 | 18 | 9,817 | 36 | 1,734,785 | 112 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 8,039 | 4 | 21,511 | 45 |
| triage | claude-sonnet-5-5 | 3 | 4,034 | 6 | 43,580 | 34 |
| refute:b3-check.mjs | claude-sonnet-5-5 | 4 | 1,863 | 8 | 82,142 | 34 |
| machine:node scripts/ui-standards/b3-check.mjs s | claude-haiku-5-5 | 2 | 1,412 | 4 | 16,885 | 16 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,188 | 4 | 13,825 | 14 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 899 | 4 | 16,871 | 6 |
| machine:node scripts/ui-standards/b3-check.mjs c | claude-haiku-5-5 | 2 | 881 | 4 | 16,885 | 6 |
| refute:b3-check.mjs | claude-sonnet-5-5 | 3 | 809 | 6 | 34,027 | 15 |
| machine:node scripts/ui-standards/b3-check.mjs d | claude-haiku-5-5 | 2 | 722 | 4 | 16,884 | 12 |
| machine:node scripts/ui-standards/b3-check.mjs s | claude-haiku-5-5 | 2 | 661 | 4 | 16,884 | 5 |
| machine:node scripts/ui-standards/b3-check.mjs s | claude-haiku-5-5 | 2 | 657 | 4 | 16,886 | 6 |
| machine:node scripts/ui-standards/b3-check.mjs d | claude-haiku-5-5 | 2 | 610 | 4 | 16,886 | 6 |
| machine:node scripts/ui-standards/b3-check.mjs a | claude-haiku-5-5 | 2 | 583 | 4 | 16,883 | 6 |
| machine:node scripts/ui-standards/b3-check.mjs p | claude-haiku-5-5 | 2 | 486 | 4 | 16,885 | 5 |
| machine:node scripts/ui-standards/b3-check.mjs f | claude-haiku-5-5 | 2 | 480 | 4 | 16,885 | 5 |
| machine:node scripts/ui-standards/b3-check.mjs p | claude-haiku-5-5 | 2 | 476 | 4 | 16,884 | 5 |
| machine:node scripts/ui-standards/b3-check.mjs d | claude-haiku-5-5 | 2 | 450 | 4 | 16,885 | 5 |
| capture:provenance | claude-sonnet-5-5 | 2 | 342 | 4 | 13,365 | 7 |


wall: 419s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 8,039 | 21,511 | 45 | 00:03:40 | 00:04:25 |
| machine | 13 | 9,505 | 216,428 | 20 | 00:03:40 | 00:04:00 |
| ui | 2 | 26,735 | 5,150,624 | 261 | 00:03:40 | 00:08:02 |
| review | 3 | 35,142 | 3,913,274 | 162 | 00:03:40 | 00:06:23 |
| triage | 1 | 4,034 | 43,580 | 34 | 00:08:02 | 00:08:36 |
| refute | 2 | 2,672 | 116,169 | 36 | 00:08:36 | 00:09:12 |
| capture | 1 | 342 | 13,365 | 7 | 00:09:12 | 00:09:19 |
| synthesize | 1 | 10,988 | 164,486 | 81 | 00:09:19 | 00:10:39 |

- **claude-opus-5-5**: 3 agent · 59 calls · out 35,142 · in 118 · cache_read 3,913,274 · cache_create 297,190
- **claude-sonnet-5-5**: 8 agent · 64 calls · out 52,810 · in 128 · cache_read 5,509,735 · cache_create 438,543
- **claude-haiku-5-5**: 13 agent · 26 calls · out 9,505 · in 52 · cache_read 216,428 · cache_create 212,618

### S4 round 2 — wf_ad1754e6-0a2 (25 agent, 107,049 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| ui:E10 | claude-sonnet-5-5 | 28 | 15,249 | 56 | 3,307,025 | 271 |
| review:bugs | claude-opus-5-5 | 29 | 14,998 | 58 | 2,538,174 | 177 |
| synthesize:report | claude-sonnet-5-5 | 6 | 14,331 | 12 | 234,529 | 100 |
| review:measurement | claude-opus-5-5 | 12 | 13,165 | 24 | 565,943 | 138 |
| ui:E13 | claude-sonnet-5-5 | 19 | 13,084 | 38 | 2,086,780 | 129 |
| review:conventions | claude-opus-5-5 | 21 | 8,209 | 42 | 1,036,392 | 98 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 7,758 | 4 | 21,143 | 38 |
| triage | claude-sonnet-5-5 | 2 | 3,760 | 4 | 18,034 | 28 |
| refute:b3-check.mjs | claude-sonnet-5-5 | 4 | 2,369 | 10 | 65,984 | 20 |
| refute:b3-check.mjs | claude-sonnet-5-5 | 4 | 1,744 | 8 | 84,031 | 17 |
| machine:node scripts/ui-standards/b3-check.mjs f | claude-haiku-5-5 | 2 | 1,618 | 4 | 16,910 | 8 |
| machine:node scripts/ui-standards/b3-check.mjs s | claude-haiku-5-5 | 2 | 1,496 | 4 | 16,910 | 13 |
| refute:b3-capture.mjs | claude-sonnet-5-5 | 5 | 1,468 | 10 | 81,192 | 14 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,365 | 4 | 13,850 | 13 |
| machine:node scripts/ui-standards/b3-check.mjs c | claude-haiku-5-5 | 2 | 1,083 | 4 | 16,910 | 6 |
| machine:node scripts/ui-standards/b3-check.mjs p | claude-haiku-5-5 | 2 | 702 | 4 | 16,909 | 5 |
| machine:node scripts/ui-standards/b3-check.mjs p | claude-haiku-5-5 | 2 | 655 | 4 | 16,910 | 5 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 601 | 4 | 16,896 | 4 |
| machine:node scripts/ui-standards/b3-check.mjs d | claude-haiku-5-5 | 2 | 552 | 4 | 16,909 | 10 |
| machine:node scripts/ui-standards/b3-check.mjs d | claude-haiku-5-5 | 2 | 551 | 4 | 16,910 | 5 |
| machine:node scripts/ui-standards/b3-check.mjs s | claude-haiku-5-5 | 2 | 539 | 4 | 16,909 | 5 |
| machine:node scripts/ui-standards/b3-check.mjs d | claude-haiku-5-5 | 2 | 507 | 4 | 16,911 | 5 |
| machine:node scripts/ui-standards/b3-check.mjs a | claude-haiku-5-5 | 2 | 471 | 4 | 16,908 | 5 |
| machine:node scripts/ui-standards/b3-check.mjs s | claude-haiku-5-5 | 2 | 434 | 4 | 16,911 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 340 | 4 | 13,132 | 4 |


wall: 425s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 7,758 | 21,143 | 38 | 00:13:35 | 00:14:13 |
| machine | 13 | 10,574 | 216,753 | 18 | 00:13:35 | 00:13:53 |
| ui | 2 | 28,333 | 5,393,805 | 271 | 00:13:35 | 00:18:06 |
| review | 3 | 36,372 | 4,140,509 | 182 | 00:13:35 | 00:16:37 |
| triage | 1 | 3,760 | 18,034 | 28 | 00:18:06 | 00:18:34 |
| refute | 3 | 5,581 | 231,207 | 21 | 00:18:34 | 00:18:55 |
| capture | 1 | 340 | 13,132 | 4 | 00:18:55 | 00:19:00 |
| synthesize | 1 | 14,331 | 234,529 | 100 | 00:19:00 | 00:20:40 |

- **claude-sonnet-5-5**: 9 agent · 72 calls · out 60,103 · in 146 · cache_read 5,911,850 · cache_create 472,035
- **claude-opus-5-5**: 3 agent · 62 calls · out 36,372 · in 124 · cache_read 4,140,509 · cache_create 296,894
- **claude-haiku-5-5**: 13 agent · 26 calls · out 10,574 · in 52 · cache_read 216,753 · cache_create 213,555

