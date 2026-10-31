### S4 round 1 — wf_859e152f-e6f (20 agent, 50,146 out-tok)

| label | model | calls | out | in | cache_read | s |
|---|---|--:|--:|--:|--:|--:|
| review:bugs | claude-opus-5-5 | 10 | 8,444 | 22 | 425,774 | 87 |
| review:measurement | claude-opus-5-5 | 8 | 6,706 | 16 | 297,419 | 71 |
| baseline:diffBase | claude-sonnet-5-5 | 3 | 6,513 | 6 | 61,150 | 35 |
| synthesize:report | claude-sonnet-5-5 | 2 | 4,791 | 4 | 31,407 | 27 |
| review:conventions | claude-opus-5-5 | 9 | 2,804 | 20 | 308,497 | 32 |
| machine:cd app && npm test | claude-haiku-5-5 | 2 | 2,588 | 4 | 22,536 | 57 |
| machine:cd agent && npm test | claude-haiku-5-5 | 2 | 2,287 | 4 | 19,398 | 43 |
| triage | claude-sonnet-5-5 | 2 | 2,173 | 4 | 21,778 | 17 |
| machine:cd pipeline && npm test | claude-haiku-5-5 | 2 | 2,090 | 4 | 22,542 | 68 |
| machine:node scripts/check-portal-compliance.mjs | claude-haiku-5-5 | 2 | 2,006 | 4 | 22,556 | 8 |
| machine:cd app && npm run test:lint-rules | claude-haiku-5-5 | 2 | 1,722 | 4 | 22,550 | 14 |
| machine:bash _acceptance/sd3-lam-chat-do-danh-ba | claude-haiku-5-5 | 2 | 1,253 | 4 | 22,584 | 10 |
| machine:node --test pipeline/do-danh-ba-sdt.test | claude-haiku-5-5 | 2 | 1,236 | 4 | 22,568 | 10 |
| machine:node _acceptance/sd3-lam-chat-do-danh-ba | claude-haiku-5-5 | 3 | 1,043 | 8 | 45,615 | 37 |
| machine:cd app && npx tsc --noEmit && npm run li | claude-haiku-5-5 | 2 | 950 | 4 | 22,561 | 14 |
| machine:bash _acceptance/sd3-lam-chat-do-danh-ba | claude-haiku-5-5 | 2 | 902 | 4 | 22,580 | 39 |
| machine:node _acceptance/sd3-lam-chat-do-danh-ba | claude-haiku-5-5 | 2 | 865 | 4 | 22,584 | 36 |
| machine:cd app && node --import tsx --test tests | claude-haiku-5-5 | 2 | 749 | 4 | 22,571 | 6 |
| machine:node _acceptance/sd3-lam-chat-do-danh-ba | claude-haiku-5-5 | 2 | 688 | 4 | 22,584 | 22 |
| capture:provenance | claude-sonnet-5-5 | 2 | 336 | 4 | 18,196 | 4 |


wall: 252s

| vai tro | agents | out | cache_read | wall s | bat dau | ket thuc |
|---|--:|--:|--:|--:|---|---|
| baseline | 1 | 6,513 | 61,150 | 35 | 12:39:49 | 12:40:24 |
| machine | 13 | 18,379 | 313,229 | 203 | 12:39:49 | 12:43:12 |
| review | 3 | 17,954 | 1,031,690 | 88 | 12:39:49 | 12:41:17 |
| triage | 1 | 2,173 | 21,778 | 17 | 12:43:12 | 12:43:30 |
| capture | 1 | 336 | 18,196 | 4 | 12:43:30 | 12:43:34 |
| synthesize | 1 | 4,791 | 31,407 | 27 | 12:43:34 | 12:44:01 |

- **claude-opus-5-5**: 3 agent · 27 calls · out 17,954 · in 58 · cache_read 1,031,690 · cache_create 183,069
- **claude-sonnet-5-5**: 4 agent · 9 calls · out 13,813 · in 18 · cache_read 132,531 · cache_create 126,959
- **claude-haiku-5-5**: 13 agent · 27 calls · out 18,379 · in 56 · cache_read 313,229 · cache_create 268,780

