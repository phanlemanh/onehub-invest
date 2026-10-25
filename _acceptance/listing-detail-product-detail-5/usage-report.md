### S4 round 1 — wf_b6fc4e34-e26 (26 agent, 85,195 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 21 | 12,191 | 42 | 1,267,321 | 155 |
| synthesize:report | claude-sonnet-5-5 | 3 | 11,133 | 6 | 84,661 | 62 |
| review:measurement | claude-opus-5-5 | 12 | 11,072 | 24 | 555,774 | 117 |
| ui:E19 | claude-sonnet-5-5 | 11 | 10,069 | 22 | 944,025 | 127 |
| review:conventions | claude-opus-5-5 | 15 | 8,451 | 30 | 672,838 | 126 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 4,554 | 4 | 24,816 | 57 |
| triage | claude-sonnet-5-5 | 2 | 3,946 | 4 | 22,214 | 26 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,304 | 4 | 20,463 | 18 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,804 | 4 | 20,459 | 9 |
| judge:E17:operational-feasibility | claude-sonnet-5-5 | 2 | 1,795 | 4 | 20,707 | 15 |
| judge:E17:domain-correctness | claude-sonnet-5-5 | 2 | 1,703 | 4 | 17,177 | 13 |
| refute:listing-detail.test.tsx | claude-sonnet-5-5 | 4 | 1,652 | 8 | 62,686 | 17 |
| judge:E17:spec-alignment | claude-sonnet-5-5 | 2 | 1,619 | 4 | 20,705 | 13 |
| refute:listing-detail.test.tsx | claude-sonnet-5-5 | 3 | 1,618 | 6 | 40,211 | 18 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,556 | 4 | 20,504 | 7 |
| machine:node scripts/check-listing-no-airdna.mjs | claude-haiku-5-5 | 2 | 1,350 | 4 | 20,250 | 7 |
| refute:listing-detail.test.tsx | claude-sonnet-5-5 | 3 | 1,260 | 6 | 43,126 | 15 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,033 | 4 | 20,317 | 15 |
| refute:listing-detail.test.tsx | claude-sonnet-5-5 | 4 | 1,027 | 8 | 59,554 | 12 |
| refute:listing-detail.test.tsx | claude-sonnet-5-5 | 4 | 1,019 | 8 | 64,292 | 12 |
| machine:cd app && node --test eslint-plugin-oneh | claude-haiku-5-5 | 2 | 926 | 4 | 20,265 | 6 |
| machine:node /Users/manhphan/.claude/plugins/cac | claude-haiku-5-5 | 2 | 858 | 4 | 20,314 | 6 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 726 | 4 | 20,510 | 5 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 583 | 4 | 20,226 | 30 |
| machine:node scripts/smoke-listing-detail.mjs | claude-haiku-5-5 | 2 | 539 | 4 | 20,248 | 23 |
| capture:provenance | claude-sonnet-5-5 | 2 | 407 | 4 | 16,262 | 5 |


wall: 270s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 4,554 | 24,816 | 57 | 11:23:38 | 11:24:35 |
| machine | 10 | 11,679 | 203,556 | 84 | 11:23:38 | 11:25:02 |
| ui | 1 | 10,069 | 944,025 | 127 | 11:23:38 | 11:25:45 |
| judge | 3 | 5,117 | 58,589 | 16 | 11:23:38 | 11:23:54 |
| review | 3 | 31,714 | 2,495,933 | 157 | 11:23:38 | 11:26:14 |
| triage | 1 | 3,946 | 22,214 | 26 | 11:26:15 | 11:26:41 |
| refute | 5 | 6,576 | 269,869 | 19 | 11:26:41 | 11:27:00 |
| capture | 1 | 407 | 16,262 | 5 | 11:27:00 | 11:27:05 |
| synthesize | 1 | 11,133 | 84,661 | 62 | 11:27:05 | 11:28:07 |

- **claude-opus-5-5**: 3 agent · 48 calls · out 31,714 · in 96 · cache_read 2,495,933 · cache_create 210,912
- **claude-sonnet-5-5**: 13 agent · 44 calls · out 41,802 · in 88 · cache_read 1,420,436 · cache_create 439,188
- **claude-haiku-5-5**: 10 agent · 20 calls · out 11,679 · in 40 · cache_read 203,556 · cache_create 184,259

### S4 round 2 — wf_8e2079dd-8cd (18 agent, 41,651 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| synthesize:report | claude-sonnet-5-5 | 8 | 11,297 | 16 | 424,414 | 76 |
| review:measurement | claude-opus-5-5 | 7 | 4,556 | 14 | 184,881 | 58 |
| review:bugs | claude-opus-5-5 | 9 | 3,397 | 18 | 243,011 | 58 |
| baseline:diffBase | claude-sonnet-5-5 | 2 | 2,442 | 4 | 19,574 | 43 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,327 | 4 | 17,182 | 42 |
| judge:E17:operational-feasibility | claude-sonnet-5-5 | 2 | 2,200 | 4 | 20,720 | 18 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,147 | 4 | 20,245 | 18 |
| review:conventions | claude-opus-5-5 | 5 | 1,854 | 10 | 106,904 | 26 |
| judge:E17:domain-correctness | claude-sonnet-5-5 | 2 | 1,828 | 4 | 17,190 | 15 |
| judge:E17:spec-alignment | claude-sonnet-5-5 | 2 | 1,771 | 4 | 20,718 | 13 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,683 | 4 | 20,253 | 8 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 1,590 | 4 | 20,241 | 8 |
| refute:listing-detail.test.tsx | claude-sonnet-5-5 | 4 | 1,411 | 8 | 67,304 | 13 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 997 | 4 | 20,264 | 12 |
| triage | claude-sonnet-5-5 | 2 | 731 | 4 | 18,786 | 7 |
| machine:node scripts/smoke-listing-detail.mjs | claude-haiku-5-5 | 2 | 555 | 4 | 20,261 | 25 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 543 | 4 | 20,259 | 4 |
| capture:provenance | claude-sonnet-5-5 | 2 | 322 | 4 | 15,978 | 4 |


wall: 192s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 2,442 | 19,574 | 43 | 11:30:33 | 11:31:16 |
| machine | 7 | 9,842 | 138,705 | 92 | 11:30:33 | 11:32:05 |
| judge | 3 | 5,799 | 58,628 | 19 | 11:30:34 | 11:30:52 |
| review | 3 | 9,807 | 534,796 | 58 | 11:30:34 | 11:31:32 |
| triage | 1 | 731 | 18,786 | 7 | 11:32:05 | 11:32:13 |
| refute | 1 | 1,411 | 67,304 | 13 | 11:32:13 | 11:32:26 |
| capture | 1 | 322 | 15,978 | 4 | 11:32:26 | 11:32:30 |
| synthesize | 1 | 11,297 | 424,414 | 76 | 11:32:30 | 11:33:46 |

- **claude-sonnet-5-5**: 8 agent · 24 calls · out 22,002 · in 48 · cache_read 604,684 · cache_create 304,792
- **claude-opus-5-5**: 3 agent · 21 calls · out 9,807 · in 42 · cache_read 534,796 · cache_create 105,421
- **claude-haiku-5-5**: 7 agent · 14 calls · out 9,842 · in 28 · cache_read 138,705 · cache_create 132,675

