### S4 round 1 — wf_820226b2-ec3 (15 agent, 71,598 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 25 | 17,249 | 52 | 1,727,287 | 221 |
| review:conventions | claude-opus-5-5 | 22 | 14,087 | 46 | 1,459,392 | 181 |
| review:measurement | claude-opus-5-5 | 9 | 13,290 | 20 | 525,184 | 151 |
| synthesize:report | claude-sonnet-5-5 | 2 | 6,653 | 4 | 41,744 | 37 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 3,763 | 6 | 63,487 | 43 |
| triage | claude-sonnet-5-5 | 2 | 3,235 | 4 | 28,939 | 28 |
| machine:cd app && npm test | claude-haiku-5-5 | 5 | 2,893 | 10 | 89,812 | 759 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 4 | 2,284 | 8 | 60,092 | 769 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 1,884 | 4 | 27,743 | 10 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,575 | 4 | 27,737 | 9 |
| machine:cd pipeline && bash ../db/db-thu.sh onei | claude-haiku-5-5 | 2 | 1,557 | 4 | 27,805 | 85 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 1,253 | 4 | 27,771 | 26 |
| machine:cd pipeline && bash ../db/db-thu.sh onei | claude-haiku-5-5 | 2 | 968 | 4 | 27,787 | 235 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 572 | 4 | 24,536 | 63 |
| capture:provenance | claude-sonnet-5-5 | 2 | 335 | 4 | 23,337 | 6 |


wall: 1725s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 3,763 | 63,487 | 43 | 01:50:25 | 01:51:08 |
| machine | 8 | 12,986 | 313,283 | 1647 | 01:50:25 | 02:17:51 |
| review | 3 | 44,626 | 3,711,863 | 223 | 01:50:25 | 01:54:08 |
| triage | 1 | 3,235 | 28,939 | 28 | 02:17:53 | 02:18:21 |
| capture | 1 | 335 | 23,337 | 6 | 02:18:23 | 02:18:29 |
| synthesize | 1 | 6,653 | 41,744 | 37 | 02:18:32 | 02:19:09 |

- **claude-opus-5-5**: 3 agent · 56 calls · out 44,626 · in 118 · cache_read 3,711,863 · cache_create 283,538
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 13,986 · in 18 · cache_read 157,507 · cache_create 151,696
- **claude-haiku-5-5**: 8 agent · 21 calls · out 12,986 · in 42 · cache_read 313,283 · cache_create 262,166

